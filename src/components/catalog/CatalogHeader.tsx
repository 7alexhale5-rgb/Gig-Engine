import BioExpander from "./BioExpander"

interface CatalogHeaderProps {
  tenant: {
    display_name: string
    tagline: string | null
    bio: string | null
    avatar_url: string | null
  }
}

export default function CatalogHeader({ tenant }: CatalogHeaderProps) {
  const { display_name, tagline, bio, avatar_url } = tenant

  // Generate initials for fallback (up to 2 chars)
  const initials = display_name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <header className="py-8 text-center">
      {/* Avatar */}
      {avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatar_url}
          alt={display_name}
          className="mx-auto h-20 w-20 rounded-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
          {initials}
        </div>
      )}

      {/* Display name */}
      <h1 className="mt-4 text-2xl font-bold text-foreground">{display_name}</h1>

      {/* Tagline */}
      {tagline && (
        <p className="mt-1 text-lg text-muted-foreground">{tagline}</p>
      )}

      {/* Bio — markdown rendered, with mobile expand toggle */}
      {bio && (
        <div className="mx-auto mt-4 max-w-2xl">
          <BioExpander bio={bio} />
        </div>
      )}
    </header>
  )
}
