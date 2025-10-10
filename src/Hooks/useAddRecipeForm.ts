import { useState, type FormEvent, type ChangeEvent, type KeyboardEvent, useRef, useEffect, useCallback } from 'react';
import { createRecipe, getPresignedUploadUrl, uploadFileToS3 } from '../Utils/api';
import type { Recipe } from '../Utils/api';

interface AddRecipeFormHook {
    editorKey: number;
    recipeTitle: string;
    recipeBody: string;
    tagList: string[];
    currentTag: string;
    images: File[];
    isSubmitting: boolean;
    titleInputRef: React.RefObject<HTMLInputElement | null>;
    tagInputRef: React.RefObject<HTMLInputElement | null>;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    uploadButtonRef: React.RefObject<HTMLButtonElement | null>;
    submitButtonRef: React.RefObject<HTMLButtonElement | null>;
    handleTitleChange: (e: ChangeEvent<HTMLInputElement>) => void;
    handleContentChange: (htmlContent: string) => void;
    handleTagInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
    handleTagKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
    removeTag: (tagToRemove: string) => void;
    handleImageChange: (e: ChangeEvent<HTMLInputElement>) => void;
    removeImage: (index: number) => void;
    handleSubmit: (e: FormEvent) => Promise<void>;
    triggerFileInput: () => void;
    handleInputFocus: (e: React.FocusEvent<HTMLInputElement | HTMLButtonElement>) => void;
    resetForm: () => void;
}

export const useAddRecipeForm = (): AddRecipeFormHook => {

    const [editorKey, setEditorKey] = useState(0); 

    const [recipeTitle, setRecipeTitle] = useState(''); 
    const [recipeBody, setRecipeBody] = useState(''); 
    const [tagList, setTagList] = useState<string[]>([]);
    const [currentTag, setCurrentTag] = useState('');
    const [images, setImages] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const titleInputRef = useRef<HTMLInputElement | null>(null);
    const tagInputRef = useRef<HTMLInputElement | null>(null);
    const uploadButtonRef = useRef<HTMLButtonElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const submitButtonRef = useRef<HTMLButtonElement | null>(null);

    useEffect(() => {
        window.scrollTo(0, 0);
        titleInputRef.current?.focus();
    }, []);

    const handleInputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLButtonElement>) => {
        e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };
    
    const handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setRecipeTitle(e.target.value);
    };

    const handleContentChange = (htmlContent: string) => {
        setRecipeBody(htmlContent);
    };
    
    const handleTagInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        setCurrentTag(e.target.value);
    };

    const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && currentTag.trim() !== '') {
            e.preventDefault();
            const newTag = currentTag.trim().toLowerCase();
            if (!tagList.includes(newTag)) {
                setTagList(prev => [...prev, newTag]);
            }
            setCurrentTag('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTagList(prev => prev.filter(tag => tag !== tagToRemove));
    };

    const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const selected = Array.from(e.target.files);
            setImages(prev => [...prev, ...selected]);
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((file, i) => {
            if (i === index) {
                try {
                    const url = URL.createObjectURL(file);
                    URL.revokeObjectURL(url);
                } catch (e) { /* ignore */ }
                return false;
            }
            return true;
        }));
    };
    
    const resetForm = useCallback(() => {
        setRecipeTitle(''); 
        setRecipeBody('');
        setTagList([]); 
        setCurrentTag('');
        
        images.forEach(file => {
             try {
                const url = URL.createObjectURL(file);
                URL.revokeObjectURL(url);
             } catch (e) { /* ignore */ }
        });
        
        setImages([]);
        
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        
        setEditorKey(prevKey => prevKey + 1); 
    }, [images]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (!recipeTitle.trim()) {
            alert('Vänligen skriv in en rubrik för receptet.');
            return;
        }
        
        const isBodyEmpty = !recipeBody.trim() || recipeBody === '<p></p>';
        if (isBodyEmpty) {
            alert('Vänligen skriv in ett recept.');
            return;
        }

        setIsSubmitting(true);

        try {
            const uploadedImageUrls: string[] = [];

            for (const file of images) {
                const presigned = await getPresignedUploadUrl(file.name, file.type);
                if (!presigned) {
                    throw new Error(`Failed to get presigned URL for ${file.name}`);
                }

                const success = await uploadFileToS3(presigned.uploadUrl, file);
                if (!success) {
                    throw new Error(`Failed to upload ${file.name}`);
                }

                const s3Url = `https://${presigned.bucket}.s3.amazonaws.com/${presigned.key}`;
                uploadedImageUrls.push(s3Url);
            }

            const newRecipe: Omit<Recipe, 'id'> = {
                title: recipeTitle.trim(), 
                bodyrecipe: recipeBody,
                tag: tagList.length > 0 ? tagList : undefined,
                imageUrls: uploadedImageUrls,
            } as any; 

            const created = await createRecipe(newRecipe);

            if (created) {
                resetForm();
                window.scrollTo({
                    top: 0,
                    left: 0,
                    behavior: 'smooth'
                });
                setTimeout(() => {
                    titleInputRef.current?.focus();
                }, 1000);
            } else {
                throw new Error('Failed to create recipe.');
            }
        } catch (error) {
            console.error(error);
            alert('Något gick fel under uppladdningen.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        editorKey,
        recipeTitle,
        recipeBody,
        tagList,
        currentTag,
        images,
        isSubmitting,
        titleInputRef,
        tagInputRef,
        fileInputRef,
        uploadButtonRef,
        submitButtonRef,
        handleTitleChange,
        handleContentChange,
        handleTagInputChange,
        handleTagKeyDown,
        removeTag,
        handleImageChange,
        removeImage,
        handleSubmit,
        triggerFileInput,
        handleInputFocus,
        resetForm,
    };
};