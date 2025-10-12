import { useState, useEffect } from 'react';
import { TagSuggestions } from "../Utils/api";

const DEBOUNCE_DELAY = 300;

export const useTagSuggestions = (tagPrefix: string): string[] => {
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [debouncedPrefix, setDebouncedPrefix] = useState(tagPrefix);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedPrefix(tagPrefix);
        }, DEBOUNCE_DELAY);

        return () => {
            clearTimeout(handler);
        };
    }, [tagPrefix]);

    useEffect(() => {
        const fetchSuggestions = async () => {
            if (!debouncedPrefix.trim()) {
                setSuggestions([]);
                return;
            }

            try {
                const fetchedSuggestions = await TagSuggestions(debouncedPrefix);
                setSuggestions(fetchedSuggestions);
            } catch (error) {
                console.error("Failed to fetch tag suggestions:", error);
                setSuggestions([]);
            }
        };

        fetchSuggestions();
    }, [debouncedPrefix]);

    return suggestions;
};