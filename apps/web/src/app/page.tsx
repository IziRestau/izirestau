import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-orange-50 to-white">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-gray-900">
          Izi<span className="text-primary">Resto</span>
        </h1>
        <p className="mt-4 text-xl text-gray-600">
          Plateforme SaaS pour revendeurs de solutions restaurant
        </p>
        <div className="mt-8 flex gap-4 justify-center">
          <Link
            href="/login"
            className="rounded-lg bg-primary px-6 py-3 text-white font-medium hover:bg-primary/90 transition"
          >
            Connexion
          </Link>
          <Link
            href="/register"
            className="rounded-lg border border-gray-300 px-6 py-3 font-medium hover:bg-gray-50 transition"
          >
            Inscription
          </Link>
        </div>
      </div>
    </div>
  )
}
