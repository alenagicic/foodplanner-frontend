import React, { type FC } from 'react';

const icons: string[] = [
    '🔪', 
    '🥣', 
    '🍳', 
    '🔥', 
    '🍽️', 
    '🧂', 
    '🥄', 
    '👩‍🍳', 
    '👨‍🍳', 
    '🧊', 
    '🍎', 
    '🥕', 
    '🌶️', 
    '🍞', 
    '🥩', 
    '🍤', 
    '🧀', 
    '☕', 
    '🎂', 
    '🍯', 
    '😋', 
    '🤤', 
    '🤩', 
    '😂', 
    '💯', 
    '✨', 
    '🎉', 
    '👍', 
    '🙏', 
    '🥰' 
];

interface IconPickerProps {
    onSelect: (icon: string) => void;
    onClose: () => void;
}

const IconPicker: FC<IconPickerProps> = ({ onSelect, onClose }) => {
    const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
    };

    return (
        <div className="icon-picker-modal" onClick={onClose} role="dialog" aria-modal="true" aria-label="Välj ikon">
            <div className="icon-picker-content" onClick={handleContentClick}>
                <div className="icon-grid">
                    {icons.map((icon, index) => (
                        <span
                            key={index}
                            className="icon-item"
                            role="button"
                            tabIndex={0}
                            aria-label={`Välj ikonen ${icon}`}
                            onClick={() => {
                                onSelect(icon);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    onSelect(icon);
                                }
                            }}
                        >
                            {icon}
                        </span>
                    ))}
                </div>
                <button 
                    className="icon-picker-close-btn" 
                    onClick={onClose} 
                    aria-label="Stäng ikonväljaren"
                >
                    &times;
                </button>
            </div>
        </div>
    );
}

export default IconPicker;