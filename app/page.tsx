export default function Home() {
  return (
    <main className="min-h-screen bg-[#F4EFE7] text-[#5E4638]">
      <section className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <div className="mb-10 text-sm uppercase tracking-[0.35em]">
          Together, 24.04.2027
        </div>

        <h1 className="text-6xl font-light tracking-tight sm:text-8xl">
          ANA
          <span className="mx-4 text-[#B76E4D]">×</span>
          NUNO
        </h1>

        <div className="mt-8 text-lg tracking-[0.3em] uppercase">
          Lisboa
        </div>

        <div className="mt-16 flex flex-col gap-3 text-sm uppercase tracking-[0.25em] sm:flex-row sm:gap-8">
          <a href="#rsvp" className="transition-opacity hover:opacity-50">
            RSVP
          </a>
          <a href="#dress-code" className="transition-opacity hover:opacity-50">
            Dress Code
          </a>
          <a href="#playlist" className="transition-opacity hover:opacity-50">
            Playlist
          </a>
        </div>
      </section>

      <section
        id="rsvp"
        className="flex min-h-screen items-center justify-center bg-[#C96F4A] px-6 text-[#FFF9F3]"
      >
        <div className="max-w-xl text-center">
          <p className="mb-6 text-sm uppercase tracking-[0.35em]">RSVP</p>
          <h2 className="text-4xl font-light sm:text-6xl">
            Introduz o teu código
          </h2>

          <div className="mt-10">
            <input
              type="text"
              placeholder="ANA-NUNO-2027-X7K3"
              className="w-full border-b border-[#FFF9F3] bg-transparent px-2 py-4 text-center text-lg outline-none placeholder:text-[#FFF9F3]/60"
            />
          </div>

          <button className="mt-8 border border-[#FFF9F3] px-8 py-3 text-sm uppercase tracking-[0.25em] transition hover:bg-[#FFF9F3] hover:text-[#C96F4A]">
            Continuar
          </button>
        </div>
      </section>

      <section
        id="dress-code"
        className="flex min-h-screen items-center justify-center px-6"
      >
        <div className="text-center">
          <p className="mb-8 text-sm uppercase tracking-[0.35em]">Dress Code</p>
          <h2 className="text-5xl font-light">Descontraído</h2>

          <div className="mt-12 flex justify-center gap-4">
            <div className="h-16 w-16 rounded-full bg-[#F4EFE7]" />
            <div className="h-16 w-16 rounded-full bg-[#D8C4AA]" />
            <div className="h-16 w-16 rounded-full bg-[#B76E4D]" />
            <div className="h-16 w-16 rounded-full bg-[#8A5A44]" />
          </div>
        </div>
      </section>

      <section
        id="playlist"
        className="flex min-h-screen items-center justify-center bg-[#8A5A44] px-6 text-[#FFF9F3]"
      >
        <div className="max-w-xl text-center">
          <p className="mb-8 text-sm uppercase tracking-[0.35em]">Playlist</p>
          <h2 className="text-4xl font-light sm:text-6xl">
            Que música não pode faltar?
          </h2>

          <div className="mt-10 space-y-4">
            <input
              type="text"
              placeholder="Música"
              className="w-full border-b border-[#FFF9F3] bg-transparent px-2 py-4 text-center outline-none placeholder:text-[#FFF9F3]/60"
            />
            <input
              type="text"
              placeholder="Artista"
              className="w-full border-b border-[#FFF9F3] bg-transparent px-2 py-4 text-center outline-none placeholder:text-[#FFF9F3]/60"
            />
          </div>

          <button className="mt-8 border border-[#FFF9F3] px-8 py-3 text-sm uppercase tracking-[0.25em] transition hover:bg-[#FFF9F3] hover:text-[#8A5A44]">
            Adicionar
          </button>
        </div>
      </section>
    </main>
  );
}