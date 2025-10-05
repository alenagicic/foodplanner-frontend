import { useState, type FormEvent, type ChangeEvent, type KeyboardEvent, useRef, useEffect } from 'react';
import { createRecipe, getPresignedUploadUrl, uploadFileToS3 } from '../Utils/api';
import type { Recipe } from '../Utils/api';
import TiptapEditor from '../Component/TiptapEditor';

export default function AddPage() {
    const [recipeTitle, setRecipeTitle] = useState(''); 
    
    const [recipeBody, setRecipeBody] = useState(''); 
    const [tagList, setTagList] = useState<string[]>([]);
    const [currentTag, setCurrentTag] = useState('');
    const [images, setImages] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const uploadButtonRef = useRef<HTMLButtonElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const titleInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        window.scrollTo(0, 0);
        titleInputRef.current?.focus();
    }, []);

    const triggerFileInput = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
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
                } catch (e) {
                }
                return false;
            }
            return true;
        }));
    };

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
                alert('Receptet laddades upp! 🎉');
                resetForm();
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

    const resetForm = () => {
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
    };

    const renderImagePreviews = () =>
        images.map((img, index) => {
            const url = URL.createObjectURL(img);
            return (
                <div className="image-preview-wrapper" key={index}>
                    <img src={url} alt={`preview-${index}`} className="image-thumb" />
                    <button
                        type="button"
                        className="remove-image-btn"
                        onClick={() => removeImage(index)}
                    >
                        &times;
                    </button>
                </div>
            );
        });

    const renderTagPills = () =>
        tagList.map(tag => (
            <span key={tag} className="tag-pill">
                {tag}
                <button
                    type="button"
                    className="remove-tag-btn"
                    onClick={() => removeTag(tag)}
                >
                    <i className="bi bi-x"></i>
                </button>
            </span>
        ));

    return (
        <div className="wrapper-page">

            <h2 className='heading-create-recipe'>Skapa recept</h2> 	

            <form className="wrapper-input-recipe" onSubmit={handleSubmit}>
                
                <label htmlFor="recipe-title-input" className="recipe-label">
                    Rubrik
                </label>
                <input
                    id="recipe-title-input"
                    type="text"
                    value={recipeTitle}
                    onChange={handleTitleChange}
                    className="recipe-title-input"
                    maxLength={100} 
                    required
                    tabIndex={1}
                    spellCheck="false"
                    ref={titleInputRef}
                />
                
                <label className="recipe-label">Recept</label>
                <TiptapEditor
                    content={recipeBody}
                    onContentChange={handleContentChange}
                    nextElementRef={null}
                />

                <label htmlFor="tag-input" className="tag-label">
                    Kategori
                    <span className="tooltip-wrapper">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="16" x2="12" y2="12" />
                            <line x1="12" y1="8" x2="12.01" y2="8" />
                        </svg>
                        <span className="tooltip-text">Taggarna är till för filtrering</span>
                    </span>
                </label>
                <input
                    id="tag-input"
                    type="text"
                    value={currentTag}
                    onChange={handleTagInputChange}
                    onKeyDown={handleTagKeyDown}
                    className="tag-input"
                    tabIndex={2}
                    spellCheck="false"
                />
                <div className="tag-list">{renderTagPills()}</div>

                <label className="image-label">Bilduppladdning</label>
                <button 
                    type="button" 
                    className="upload-image-btn" 
                    onClick={triggerFileInput}
                    ref={uploadButtonRef}
                    tabIndex={3} 
                >
                    Ladda upp
                </button>
                <input
                    type="file"
                    accept="image/*"
                    multiple
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                />

                <div className="image-preview-list">{renderImagePreviews()}</div>

                <button type="submit" className="btn-actual" disabled={isSubmitting} tabIndex={4}>
                    {isSubmitting ? 'Laddar upp..' : 'Bearbeta'}
                </button>
            </form>
        </div>
    );
}