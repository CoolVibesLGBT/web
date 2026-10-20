export default function CharacterPortrait({
  character,
  label = '',
}: {
  character: number
  label?: string
}) {
  return (
    <span
      className="cv-landing-character"
      role={label ? 'img' : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
      style={{
        backgroundPosition: `${(character % 3) * 50}% ${Math.floor(character / 3) * 100}%`,
      }}
    />
  )
}
