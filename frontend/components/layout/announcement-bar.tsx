
const announcementText = [
  "AURELLE SALE IS LIVE! ✨",
  "UP TO 50% OFF",
  "FUEL YOUR FITNESS JOURNEY 💪",
  "SHOP NOW",
];

export function AnnouncementBar() {
  return (
    <div className="announcement-bar">
      <div className="announcement-track">
        {[1, 2, 3, 4].map((group) => (
          <div className="announcement-group" key={group}>
            {announcementText.map((text, index) => (
              <span key={index}>
                {text}
                <span className="announcement-divider">✦</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
