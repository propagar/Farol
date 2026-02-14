
import React from 'react';
import { Category } from '../types';

interface CategoryPillProps {
    category: Category;
}

const CategoryPill: React.FC<CategoryPillProps> = ({ category }) => {
    return (
        <span className={`px-2.5 py-0.5 text-xs font-semibold text-white rounded-full ${category.color}`}>
            {category.name}
        </span>
    );
};

export default CategoryPill;
