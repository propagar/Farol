
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage, PendingPurchase, PendingInvestment } from '../types';
import { SparklesIcon, SpinnerIcon, CloseIcon, PaperClipIcon, MicrophoneIcon, PlayIcon, StopIcon, BrainCircuitIcon, GoogleIcon } from './Icons';
import { GoogleGenAI, Modality, Blob, LiveServerMessage } from '@google/genai';

// Funções de codificação/decodificação de áudio (compatíveis com o navegador)
function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}


interface FloatingAIAssistantProps {
    messages: ChatMessage[];
    isLoading: boolean;
    onNewMessage: (message: ChatMessage) => void;
    onAiRequest: (
        prompt: string, 
        history: ChatMessage[],
        options: { 
            media?: { mimeType: string, data: string },
            isThinkingMode?: boolean,
            isImageGeneration?: boolean,
            imageEditing?: boolean,
            imageSize?: '1K' | '2K' | '4K',
            aspectRatio?: string;
        }
    ) => void;
    assistantName: string;
    appColor: string;
    onConfirmPurchase: (pendingTx: PendingPurchase) => void;
    onCancelPurchase: (transactionId: string) => void;
    onEditPurchase: (transactionId: string) => void;
    onConfirmInvestment: (pendingInv: PendingInvestment) => void;
    onCancelInvestment: (investmentId: string) => void;
}

const FloatingAIAssistant: React.FC<FloatingAIAssistantProps> = ({ 
    messages: parentMessages, 
    isLoading, 
    onAiRequest, 
    onNewMessage, 
    assistantName, 
    appColor,
    onConfirmPurchase,
    onCancelPurchase,
    onEditPurchase,
    onConfirmInvestment,
    onCancelInvestment
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [image, setImage] = useState<{ file: File, preview: string, data: string, mimeType: string } | null>(null);
    const [isThinkingMode, setIsThinkingMode] = useState(false);
    const [isImageGenMode, setIsImageGenMode] = useState(false);
    const [imageAspectRatio, setImageAspectRatio] = useState('1:1');
    const [isRecording, setIsRecording] = useState(false);
    const [currentPlayingAudio, setCurrentPlayingAudio] = useState<AudioBufferSourceNode | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const liveSession = useRef<any | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

    useEffect(() => {
        setMessages(parentMessages);
    }, [parentMessages]);

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([
                { role: 'model', text: `Olá! Sou seu ${assistantName}. Como posso te ajudar a organizar suas finanças e tarefas hoje? Você pode me pedir para:\n\n- Registrar uma despesa: "Gastei 50 reais no almoço com PIX"\n- Gerar uma imagem: "Crie uma imagem de um farol na praia"\n- Pesquisar tarefas: "O que eu completei sobre o relatório?"\n- Pesquisar algo: "Quais as últimas notícias sobre o mercado de ações?"` }
            ]);
        }
    }, [isOpen, messages.length, assistantName]);


    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages, isLoading]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const dataUrl = reader.result as string;
                const base64String = dataUrl.split(',')[1];
                setImage({
                    file,
                    preview: dataUrl, // Use Data URL for preview
                    data: base64String,
                    mimeType: file.type,
                });
            };
            reader.readAsDataURL(file);
        }
        // Clear the input value to allow re-selecting the same file
        if (event.target) {
            event.target.value = '';
        }
    };
    
    const playTextToSpeech = useCallback(async (text: string) => {
        if (currentPlayingAudio) {
            currentPlayingAudio.stop();
        }

        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        const audioContext = audioContextRef.current;

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash-preview-tts",
                contents: [{ parts: [{ text }] }],
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
                },
            });

            const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
                const audioBuffer = await decodeAudioData(decode(base64Audio), audioContext, 24000, 1);
                const source = audioContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(audioContext.destination);
                source.start();
                source.onended = () => setCurrentPlayingAudio(null);
                setCurrentPlayingAudio(source);
            }
        } catch (error) {
            console.error("Erro ao gerar áudio:", error);
        }
    }, [currentPlayingAudio]);

    const handleToggleRecording = useCallback(async () => {
        if (isRecording) {
            // Stop recording
            liveSession.current?.close();
            liveSession.current = null;
            
            if(scriptProcessorRef.current) {
                scriptProcessorRef.current.disconnect();
                scriptProcessorRef.current = null;
            }
            if(mediaStreamSourceRef.current) {
                mediaStreamSourceRef.current.disconnect();
                mediaStreamSourceRef.current = null;
            }
            // Do not close inputAudioContextRef here to avoid recreating it
            setIsRecording(false);
        } else {
            // Start recording
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                setIsRecording(true);

                if (!inputAudioContextRef.current) {
                    inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                }
                const audioContext = inputAudioContextRef.current;
                
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                const sessionPromise = ai.live.connect({
                    model: 'gemini-2.5-flash-native-audio-preview-12-2025',
                    callbacks: {
                        onopen: () => {
                            const source = audioContext.createMediaStreamSource(stream);
                            mediaStreamSourceRef.current = source;
                            const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);
                            scriptProcessorRef.current = scriptProcessor;

                            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                                const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                                const l = inputData.length;
                                const int16 = new Int16Array(l);
                                for (let i = 0; i < l; i++) {
                                    int16[i] = inputData[i] * 32768;
                                }
                                const pcmBlob: Blob = {
                                    data: encode(new Uint8Array(int16.buffer)),
                                    mimeType: 'audio/pcm;rate=16000',
                                };
                                sessionPromise.then((session) => {
                                    session.sendRealtimeInput({ media: pcmBlob });
                                });
                            };
                            source.connect(scriptProcessor);
                            scriptProcessor.connect(audioContext.destination);
                        },
                        onmessage: (message: LiveServerMessage) => {
                            if (message.serverContent?.inputTranscription) {
                                const text = message.serverContent.inputTranscription.text;
                                setInput(prev => prev + text);
                            }
                        },
                        onerror: (e: ErrorEvent) => console.error('Live error:', e),
                        onclose: () => {
                            stream.getTracks().forEach(track => track.stop());
                        },
                    },
                    config: {
                        responseModalities: [Modality.AUDIO],
                        inputAudioTranscription: {},
                    },
                });
                liveSession.current = await sessionPromise;

            } catch (error) {
                console.error("Erro ao acessar microfone:", error);
                setIsRecording(false);
            }
        }
    }, [isRecording]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const prompt = input.trim();
        const isImageAction = image !== null;
        
        const isImageGenerationRequest = isImageGenMode || /^(gere|crie|desenhe)\s+(uma\s+)?imagem/i.test(prompt);
        const isImageEditingRequest = isImageAction && !isImageGenerationRequest;

        if ((prompt || isImageAction) && !isLoading) {
            onNewMessage({ role: 'user', text: prompt, imageUrl: image?.preview });
            onAiRequest(prompt, messages, { 
                media: image ? { mimeType: image.mimeType, data: image.data } : undefined,
                isThinkingMode,
                isImageGeneration: isImageGenerationRequest,
                imageEditing: isImageEditingRequest,
                aspectRatio: imageAspectRatio,
            });
            setInput('');
            setImage(null);
            setIsImageGenMode(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-4 right-4 z-40 bg-${appColor}-600 text-white rounded-full p-4 shadow-lg hover:bg-${appColor}-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${appColor}-500 focus:ring-offset-slate-100 dark:focus:ring-offset-slate-900 transition-transform transform hover:scale-110`}
                aria-label={isOpen ? "Fechar Assistente" : "Abrir Assistente"}
            >
                {isOpen ? <CloseIcon /> : <SparklesIcon className="w-8 h-8"/>}
            </button>
            {isOpen && (
                <div className="fixed bottom-20 right-4 z-40 w-[calc(100vw-2rem)] max-w-md h-[70vh] max-h-[600px] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl flex flex-col border border-slate-200 dark:border-slate-700"
                >
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                            <SparklesIcon />
                            <span>{assistantName}</span>
                        </h2>
                        <div title="Modo Pensamento Profundo" className="flex items-center gap-2">
                             <BrainCircuitIcon className="text-slate-500"/>
                             <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={isThinkingMode} onChange={() => setIsThinkingMode(p => !p)} className="sr-only peer" />
                                <div className={`w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-${appColor}-300 dark:peer-focus:ring-${appColor}-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-${appColor}-600`}></div>
                            </label>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-xs md:max-w-sm lg:max-w-md px-4 py-2 rounded-2xl ${msg.role === 'user' ? `bg-${appColor}-600 text-white` : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'}`}>
                                    {msg.imageUrl && <img src={msg.imageUrl} alt="Imagem do chat" className="rounded-lg mb-2" />}
                                    
                                    <p className="text-sm whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br />') }} />

                                    {msg.pendingPurchase && (
                                        <div className="mt-3 pt-3 border-t border-slate-300 dark:border-slate-600 flex justify-end gap-2">
                                            <button onClick={() => onConfirmPurchase(msg.pendingPurchase!)} className="px-3 py-1 text-sm rounded-md text-white bg-emerald-600 hover:bg-emerald-700">Confirmar</button>
                                            <button onClick={() => onEditPurchase(msg.pendingPurchase!.id)} className="px-3 py-1 text-sm rounded-md text-slate-700 bg-slate-300 hover:bg-slate-400 dark:text-slate-200 dark:bg-slate-600 dark:hover:bg-slate-500">Alterar</button>
                                            <button onClick={() => onCancelPurchase(msg.pendingPurchase!.id)} className="px-3 py-1 text-sm rounded-md text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-500">Cancelar</button>
                                        </div>
                                    )}

                                    {msg.pendingInvestment && (
                                        <div className="mt-3 pt-3 border-t border-slate-300 dark:border-slate-600 flex justify-end gap-2">
                                            <button onClick={() => onConfirmInvestment(msg.pendingInvestment!)} className="px-3 py-1 text-sm rounded-md text-white bg-emerald-600 hover:bg-emerald-700">Confirmar</button>
                                            <button onClick={() => onCancelInvestment(msg.pendingInvestment!.id)} className="px-3 py-1 text-sm rounded-md text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-500">Cancelar</button>
                                        </div>
                                    )}

                                    {msg.groundingChunks && msg.groundingChunks.length > 0 && (
                                        <div className="mt-3 pt-2 border-t border-slate-300 dark:border-slate-600">
                                            <h4 className="text-xs font-semibold mb-1 flex items-center gap-1"><GoogleIcon/> Fontes:</h4>
                                            <div className="flex flex-col items-start gap-1">
                                                {msg.groundingChunks.map((chunk, i) => (
                                                    <a key={i} href={chunk.uri} target="_blank" rel="noopener noreferrer" className={`text-xs text-${appColor}-500 dark:text-${appColor}-400 hover:underline truncate`}>
                                                        {chunk.title}
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                 {msg.role === 'model' && !msg.pendingPurchase && !msg.pendingInvestment && (
                                    <button onClick={() => playTextToSpeech(msg.text)} className={`p-1.5 text-slate-400 hover:text-${appColor}-500 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600`}>
                                        {currentPlayingAudio ? <StopIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
                                    </button>
                                )}
                            </div>
                        ))}
                        {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
                            <div className="flex justify-start">
                                <div className="px-4 py-3 rounded-2xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                                    <SpinnerIcon />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                    
                    <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-b-2xl flex-shrink-0">
                        {isImageGenMode && (
                            <div className="mb-2">
                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Proporção da Imagem:</label>
                                <div className="flex gap-2 mt-1 overflow-x-auto pb-2">
                                    {["1:1", "16:9", "9:16", "4:3", "3:4"].map(size => (
                                        <button key={size} onClick={() => setImageAspectRatio(size)} className={`px-3 py-1 text-xs rounded-full whitespace-nowrap ${imageAspectRatio === size ? `bg-${appColor}-600 text-white` : 'bg-slate-200 dark:bg-slate-700'}`}>{size}</button>
                                    ))}
                                </div>
                            </div>
                        )}
                        {image && (
                            <div className="relative mb-2 w-20 h-20">
                                <img src={image.preview} alt="Preview" className="w-full h-full object-cover rounded-lg"/>
                                <button onClick={() => setImage(null)} className="absolute top-0 right-0 -mt-1 -mr-1 bg-slate-600 text-white rounded-full p-0.5"><CloseIcon /></button>
                            </div>
                        )}
                        <form onSubmit={handleSubmit} className="flex items-center gap-2">
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                            <button type="button" onClick={() => fileInputRef.current?.click()} className={`p-2 text-slate-500 hover:text-${appColor}-600 dark:text-slate-400 dark:hover:text-${appColor}-400 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors`} title="Anexar Mídia"><PaperClipIcon /></button>
                            <button type="button" onClick={handleToggleRecording} className={`p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${isRecording ? 'text-red-500 animate-pulse' : `text-slate-500 hover:text-${appColor}-600 dark:text-slate-400 dark:hover:text-${appColor}-400`}`} title={isRecording ? 'Parar Gravação' : 'Gravar Áudio'}><MicrophoneIcon /></button>
                            <input value={input} onChange={(e) => setInput(e.target.value)} onFocus={() => setIsImageGenMode(/^(gere|crie|desenhe)\s+(uma\s+)?imagem/i.test(input))} onKeyDown={(e) => {if (e.key === 'Enter' && !e.shiftKey) {handleSubmit(e);}}} placeholder="Pergunte ou registre algo..." className={`flex-grow block w-full rounded-full border-gray-300 bg-slate-100 dark:bg-slate-700 dark:border-slate-600 dark:placeholder-slate-400 dark:text-white shadow-sm focus:border-${appColor}-500 focus:ring-${appColor}-500 sm:text-sm px-4 py-2`} disabled={isLoading} />
                            <button type="submit" disabled={isLoading || (!input.trim() && !image)} className={`bg-${appColor}-600 text-white font-semibold py-2 px-4 rounded-full shadow-sm hover:bg-${appColor}-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}>Enviar</button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default FloatingAIAssistant;