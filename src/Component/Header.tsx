export default function Header() {

  const reload = () => {
    window.location.href = window.location.origin;
  }

  return (
    <header>
      
      <div onClick={reload} className='wrapper-svg-header'>
        <h2 className="header-great-vibes">
          Matabas.se
        </h2>
      </div>
   
      <h4>
        - Alla dina recept på ett ställe
      </h4>

    </header>
  );
}
