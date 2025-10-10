// Fil: AddPage.tsx

import TiptapEditor from '../Component/TiptapEditor';
import { useAddRecipeForm } from '../Hooks/useAddRecipeForm';

const renderImagePreviews = (images: File[], removeImage: (index: number) => void) =>
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

const renderTagPills = (tagList: string[], removeTag: (tag: string) => void) =>
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

export default function AddPage() {
    const {
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
    } = useAddRecipeForm();

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
                    onFocus={handleInputFocus}
                    className="recipe-title-input"
                    maxLength={100} 
                    required
                    tabIndex={1}
                    spellCheck="false"
                    ref={titleInputRef}
                />
                
                <label className="recipe-label">Recept</label>
                <TiptapEditor
                    key={editorKey} 
                    content={recipeBody}
                    onContentChange={handleContentChange}
                    nextElementRef={tagInputRef} 
                />

                <label htmlFor="tag-input" className="tag-label">
                    Kategori
                    <span className="tooltip-wrapper">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="16" x2="12" y2="12" />
                            <line x1="12" y1="8" x2="12.01" y2="8" />
                        </svg>
                        <span className="tooltip-text">Taggarna är till för filtrering. <br /> Tryck enter för att lägga till.</span>
                    </span>
                </label>
                <input
                    id="tag-input"
                    type="text"
                    value={currentTag}
                    onChange={handleTagInputChange}
                    onKeyDown={handleTagKeyDown}
                    onFocus={handleInputFocus}
                    className="tag-input"
                    tabIndex={2}
                    spellCheck="false"
                    ref={tagInputRef}
                />
                <div className="tag-list">{renderTagPills(tagList, removeTag)}</div>

                <label className="image-label">Bilduppladdning</label>
                <button 
                    type="button" 
                    className="upload-image-btn" 
                    onClick={triggerFileInput}
                    onFocus={handleInputFocus}
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
                    tabIndex={-1} 
                />

                <div className="image-preview-list">{renderImagePreviews(images, removeImage)}</div>

                <button 
                    type="submit" 
                    className="btn-actual" 
                    disabled={isSubmitting} 
                    tabIndex={4}
                    onFocus={handleInputFocus}
                    ref={submitButtonRef}
                >
                    {isSubmitting ? 'Laddar upp..' : 'Bearbeta'}
                </button>
            </form>
        </div>
    );
}