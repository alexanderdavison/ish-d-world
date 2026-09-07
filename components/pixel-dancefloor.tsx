import Image from "next/image";

const dancers = [
  { src: "/characters/dancer-arms-up.png", motion: "dancer-arms-up" },
  { src: "/characters/dancer-shuffle.png", motion: "dancer-shuffle" },
  { src: "/characters/dancer-low-groove.png", motion: "dancer-low-groove" },
  { src: "/characters/dancer-house-groove.png", motion: "dancer-house-groove" },
  { src: "/characters/dancer-angular.png", motion: "dancer-angular" },
  { src: "/characters/dancer-waack-turn.png", motion: "dancer-waack-turn" },
] as const;

export function PixelDancefloor() {
  return (
    <div className="pixel-dancefloor" aria-hidden="true">
      <div className="dancefloor-label">
        <span>DANCE FLOOR / LIVE</span>
        <i />
      </div>
      <div className="dancer-line">
        {dancers.map((dancer, index) => (
          <div
            className={`dancer ${dancer.motion} dancer-slot-${index + 1}`}
            key={`${dancer.src}-${index}`}
          >
            <Image
              src={dancer.src}
              alt=""
              width={256}
              height={384}
              draggable="false"
              unoptimized
            />
          </div>
        ))}
      </div>
      <div className="dancefloor-grid" />
    </div>
  );
}
