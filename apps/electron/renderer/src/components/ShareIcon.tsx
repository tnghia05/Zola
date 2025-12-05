// ShareIcon Component
// Sử dụng SVG file từ Figma (Frame 19)
// File: src/assets/icons/share.svg

import shareSvg from '../assets/icons/share.svg';

type ShareIconProps = {
  size?: number;
  color?: string;
  className?: string;
};

export const ShareIcon = ({ 
  size = 20, 
  color,
  className = ''
}: ShareIconProps) => {
  // Nếu cần đổi màu, dùng inline SVG với currentColor
  // Nếu không, dùng image file (nhanh hơn)
  if (color && color !== 'currentColor') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={{ 
          display: 'inline-block', 
          verticalAlign: 'middle',
          color: color
        }}
      >
        {/* SVG code từ share.svg - đã đổi fill="#0966FF" thành fill="currentColor" */}
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M32.5 27.6963C27.2533 27.6963 23 31.9496 23 37.1963V67.1963C23 72.443 27.2533 76.6963 32.5 76.6963H62.5C67.7467 76.6963 72 72.443 72 67.1963V52.1963C72 50.8156 73.1193 49.6963 74.5 49.6963C75.8807 49.6963 77 50.8156 77 52.1963V67.1963C77 75.2044 70.5081 81.6963 62.5 81.6963H32.5C24.4919 81.6963 18 75.2044 18 67.1963V37.1963C18 29.1882 24.4919 22.6963 32.5 22.6963H49.5C50.8807 22.6963 52 23.8156 52 25.1963C52 26.577 50.8807 27.6963 49.5 27.6963H32.5Z"
          fill="currentColor"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M34.1263 56.0649C34.1317 55.409 34.3947 54.7816 34.8585 54.3178L67.7015 21.4748C69.0683 20.108 71.2844 20.108 72.6512 21.4748L79.7223 28.5459C81.0891 29.9127 81.0891 32.1288 79.7223 33.4956L46.8793 66.3386C46.4155 66.8024 45.788 67.0653 45.1322 67.0708L36.5762 67.1415C35.906 67.147 35.2617 66.8832 34.7878 66.4093C34.3138 65.9354 34.0501 65.2911 34.0556 64.6209L34.1263 56.0649ZM39.1177 57.1296L39.0764 62.1206L44.0674 62.0794L75.1261 31.0208L70.1763 26.071L39.1177 57.1296Z"
          fill="currentColor"
        />
      </svg>
    );
  }

  // Dùng SVG file (nhanh hơn, nhưng không đổi màu được)
  return (
    <img
      src={shareSvg}
      alt="Share"
      width={size}
      height={size}
      className={className}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle'
      }}
    />
  );
};

export default ShareIcon;

