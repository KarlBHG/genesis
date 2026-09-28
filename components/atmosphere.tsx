/** Fixed ambient layer — grain, aurora orbs, vignette. Sits behind all pages. */
export function Atmosphere() {
  return (
    <div aria-hidden className="atmosphere">
      <div className="atmosphere-vignette" />
      <div className="atmosphere-orb atmosphere-orb-a" />
      <div className="atmosphere-orb atmosphere-orb-b" />
      <div className="atmosphere-orb atmosphere-orb-c" />
      <div className="atmosphere-grain" />
    </div>
  );
}
