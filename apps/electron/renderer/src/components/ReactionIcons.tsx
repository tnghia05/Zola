// ReactionIcons - Facebook-style reaction icons using SVG
// Icons from packages/app/assets/icons/

type ReactionIconProps = {
  size?: number;
  className?: string;
};

// Like (Thumbs Up) - Blue gradient
export const LikeIcon = ({ size = 24, className = '' }: ReactionIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path d="M59.9999 0C26.8499 0 0 26.85 0 59.9999C0 93.1498 26.8499 120 59.9999 120C93.1498 120 120 93.1498 120 59.9999C120 26.85 93.1498 0 59.9999 0Z" fill="url(#like_gradient)"/>
    <path d="M90.2999 55.05C94.3499 57.9 93.5999 63.9 89.2499 66.15C91.4999 69.8999 88.6499 74.8499 84.7499 75.8999C85.3499 76.9499 85.6499 77.8499 85.4999 78.8999C84.8999 83.2499 80.0999 83.9999 76.4999 83.9999H56.8499C49.05 83.9999 45.15 79.6499 45.15 76.0499V57.6C45.15 47.85 56.0999 39.6 56.0999 32.7L55.1999 24.3C55.1999 23.85 55.1999 22.5 55.6499 22.2C56.2499 21.6 58.0499 20.55 60.5999 20.55C62.2499 20.55 63.4499 20.8501 64.7999 21.6001C69.2999 23.85 69.8999 29.4 69.8999 33.9C69.8999 36 67.1999 42.45 66.8999 44.7C70.3499 43.5 78.4499 42.15 84.7499 43.05C92.0999 44.1 94.1999 49.05 90.2999 55.05ZM28.65 48H34.95C36.15 48 37.35 48.45 38.25 49.35C39.15 50.25 39.6 51.45 39.6 52.65V82.7999C39.6 83.9999 39.15 85.1999 38.25 86.0999C37.35 86.9999 36.15 87.4499 34.95 87.4499H28.65C27.45 87.4499 26.25 86.9999 25.35 86.0999C24.45 85.1999 24 83.9999 24 82.7999V52.65C24 51.45 24.45 50.25 25.35 49.35C26.25 48.45 27.45 48 28.65 48Z" fill="white"/>
    <defs>
      <radialGradient id="like_gradient" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(41.8938 37.318) rotate(77.6772) scale(84.6968 84.6968)">
        <stop stopColor="#18AFFF"/>
        <stop offset="1" stopColor="#0062DF"/>
      </radialGradient>
    </defs>
  </svg>
);

// Love (Heart) - Red/pink gradient
export const LoveIcon = ({ size = 24, className = '' }: ReactionIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path d="M59.9999 0C26.8499 0 0 26.85 0 59.9999C0 93.1498 26.8499 120 59.9999 120C93.1498 120 120 93.1498 120 59.9999C120 26.85 93.1498 0 59.9999 0Z" fill="url(#love_gradient)"/>
    <path d="M78.6009 30C62.1009 30 60.0009 43.65 60.0009 43.65C60.0009 43.65 57.9009 30 41.401 30C25.501 30 20.851 46.65 22.801 55.6499C27.901 79.1999 59.8509 95.6999 59.8509 95.6999C59.8509 95.6999 91.8009 79.1999 96.9009 55.6499C99.0009 46.65 94.3508 30 78.6009 30Z" fill="white"/>
    <defs>
      <radialGradient id="love_gradient" cx="0" cy="0" r="1" gradientTransform="matrix(16.2437 63.5304 -63.5294 16.2438 53.436 53.3625)" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FF8297"/>
        <stop offset="0.1592" stopColor="#FD7A90"/>
        <stop offset="0.4121" stopColor="#F8637B"/>
        <stop offset="0.7251" stopColor="#EF3D5B"/>
        <stop offset="1" stopColor="#E61739"/>
      </radialGradient>
    </defs>
  </svg>
);

// Haha (Laughing) - Yellow/orange gradient
export const HahaIcon = ({ size = 24, className = '' }: ReactionIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path d="M119.999 59.9999C119.999 93.1657 93.2656 120 60.2242 120C27.1827 120 0.449219 93.1657 0.449219 59.9999C0.449219 26.8341 27.1827 0 60.2242 0C93.1154 0 119.999 26.8341 119.999 59.9999Z" fill="url(#haha_gradient1)"/>
    <path d="M119.55 59.9999C119.55 93.1657 92.8164 120 59.775 120C26.7335 120 0 93.1657 0 59.9999C0 26.8341 26.7335 0 59.775 0C92.6662 0 119.55 26.8341 119.55 59.9999Z" fill="url(#haha_gradient2)"/>
    <path d="M95.9649 71.1555C96.4155 68.5927 95.3641 66.0299 92.9611 65.1254C87.5544 62.8641 76.5906 59.9998 59.6194 59.9998C42.7983 59.9998 31.8345 62.8641 26.2775 65.1254C23.8745 66.0299 22.8232 68.5927 23.2738 71.1555C26.2775 86.5324 35.8896 105.226 59.6194 105.226C83.3491 105.075 92.9611 86.3816 95.9649 71.1555Z" fill="url(#haha_mouth)"/>
    <path d="M83.8003 95.7286C79.2947 91.5075 71.7852 88.1909 59.7702 88.1909C47.6049 88.1909 40.0955 91.5075 35.5898 95.7286C41.297 101.306 49.1068 105.075 59.62 105.075C70.2833 105.075 78.0931 101.306 83.8003 95.7286Z" fill="url(#haha_tongue)"/>
    <path d="M28.6853 50.3518C26.7328 50.3518 25.2309 48.8442 24.9306 46.8844C24.1796 38.7437 30.1872 31.5076 38.4475 30.7538C46.5577 30 53.7667 36.0302 54.5177 44.3216C54.6679 46.4322 53.166 48.2412 51.2135 48.392C49.1109 48.5427 47.3086 47.0352 47.1584 45.0754C46.858 41.005 43.2535 37.99 39.1985 38.2915C35.1434 38.593 32.1396 42.2111 32.44 46.2814C32.5902 48.392 31.0883 50.201 29.1358 50.3518C28.8354 50.3518 28.6853 50.3518 28.6853 50.3518Z" fill="url(#haha_eye_left)"/>
    <path d="M90.7126 50.3519C90.5624 50.3519 90.5624 50.3519 90.4122 50.3519C88.3096 50.2011 86.8078 48.3921 87.1082 46.2815C87.4085 42.2112 84.4048 38.5931 80.3497 38.2916C76.2946 37.9901 72.6901 40.8544 72.3897 45.0755C72.2395 47.186 70.4372 48.6936 68.3346 48.3921C66.2319 48.2413 64.7301 46.4323 65.0305 44.3217C65.7814 36.0303 72.9905 30.1509 81.1006 30.7539C89.2108 31.5077 95.2183 38.7438 94.6176 46.8845C94.167 48.8443 92.5149 50.3519 90.7126 50.3519Z" fill="url(#haha_eye_right)"/>
    <defs>
      <radialGradient id="haha_gradient1" cx="0" cy="0" r="1" gradientTransform="matrix(-0.141675 81.2323 -83.6337 -0.146963 59.229 49.6661)" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FFED85"/>
        <stop offset="0.1898" stopColor="#FFE180"/>
        <stop offset="0.5295" stopColor="#FFC273"/>
        <stop offset="0.9773" stopColor="#FF915E"/>
        <stop offset="1" stopColor="#FF8E5D"/>
      </radialGradient>
      <radialGradient id="haha_gradient2" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(32.3913 29.692) scale(99.6575 100.032)">
        <stop stopColor="#FFEA84" stopOpacity="0"/>
        <stop offset="1" stopColor="#F08423" stopOpacity="0.34"/>
      </radialGradient>
      <linearGradient id="haha_mouth" x1="59.6193" y1="61.8679" x2="59.6193" y2="114.428" gradientUnits="userSpaceOnUse">
        <stop stopColor="#3F1D04"/>
        <stop offset="1" stopColor="#7E2307"/>
      </linearGradient>
      <linearGradient id="haha_tongue" x1="59.6951" y1="86.3056" x2="59.6951" y2="104.754" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FC607C"/>
        <stop offset="1" stopColor="#D91F3A"/>
      </linearGradient>
      <radialGradient id="haha_eye_left" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(39.6977 40.4935) scale(12.5283 12.5754)">
        <stop stopColor="#2C445F"/>
        <stop offset="0.9792" stopColor="#191A33"/>
      </radialGradient>
      <radialGradient id="haha_eye_right" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(79.6228 40.4933) scale(12.5424 12.5896)">
        <stop stopColor="#2C445F"/>
        <stop offset="0.9792" stopColor="#191A33"/>
      </radialGradient>
    </defs>
  </svg>
);

// Wow (Surprised) - Yellow/orange gradient
export const WowIcon = ({ size = 24, className = '' }: ReactionIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path d="M120 59.9999C120 93.1498 93.1498 120 59.9999 120C26.8499 120 0 93.1498 0 59.9999C0 26.85 26.8499 0 59.9999 0C93.1498 0 120 26.85 120 59.9999Z" fill="url(#wow_gradient1)"/>
    <path d="M120 59.9999C120 93.1498 93.1498 120 59.9999 120C26.8499 120 0 93.1498 0 59.9999C0 26.85 26.8499 0 59.9999 0C93.1498 0 120 26.85 120 59.9999Z" fill="url(#wow_gradient2)"/>
    <path d="M42.4481 81.1498C41.2481 94.9497 47.8481 104.4 59.9981 104.4C72.1481 104.4 78.7481 94.9497 77.5481 81.1498C76.3481 67.3498 69.2981 59.5498 59.9981 59.5498C50.8481 59.6998 43.6481 67.4998 42.4481 81.1498Z" fill="url(#wow_mouth)"/>
    <path d="M92.8482 24.1498C89.8482 20.2498 85.0482 18.8998 78.5982 22.1998C77.2482 22.9498 75.5982 22.3498 74.8482 20.9998C74.0982 19.6498 74.6982 17.9998 76.0482 17.2498C85.0482 12.7498 92.6981 14.9998 97.1981 20.8498C98.0981 22.0498 97.9481 23.8498 96.7481 24.7498C95.5481 25.4998 93.7482 25.3498 92.8482 24.1498Z" fill="#E27421"/>
    <path d="M27.2977 24.1498C30.2977 20.2498 35.0977 18.8998 41.5477 22.1998C42.8977 22.9498 44.5477 22.3498 45.2977 20.9998C46.0477 19.6498 45.4477 17.9998 44.0977 17.2498C35.0978 12.7498 27.4477 14.9998 22.9477 20.8498C22.0477 22.0498 22.1977 23.8498 23.3977 24.7498C24.5977 25.4998 26.3977 25.3498 27.2977 24.1498Z" fill="#E27421"/>
    <path d="M72.5996 42.8994C72.5996 36.7494 77.2496 31.6494 82.7996 31.6494C88.4996 31.6494 92.9995 36.5994 92.9995 42.8994C92.9995 49.0494 88.3496 54.1494 82.7996 54.1494C77.2496 54.1494 72.5996 49.0494 72.5996 42.8994Z" fill="url(#wow_eye_right)"/>
    <path d="M77.0996 38.5495C77.0996 36.5995 78.2995 34.9495 79.6495 34.9495C80.9995 34.9495 82.1995 36.5995 82.1995 38.5495C82.1995 40.4995 80.9995 42.1495 79.6495 42.1495C78.2995 42.1495 77.0996 40.4995 77.0996 38.5495Z" fill="#4E506A"/>
    <path d="M47.5504 42.8994C47.5504 36.7494 42.9004 31.6494 37.3504 31.6494C31.6505 31.6494 27.1504 36.5994 27.1504 42.8994C27.1504 49.0494 31.8005 54.1494 37.3504 54.1494C42.9004 54.1494 47.5504 49.0494 47.5504 42.8994Z" fill="url(#wow_eye_left)"/>
    <path d="M35.5512 38.5495C35.5512 36.5995 34.3512 34.9495 33.0012 34.9495C31.6512 34.9495 30.4512 36.5995 30.4512 38.5495C30.4512 40.4995 31.6512 42.1495 33.0012 42.1495C34.3512 42.1495 35.5512 40.4995 35.5512 38.5495Z" fill="#4E506A"/>
    <defs>
      <radialGradient id="wow_gradient1" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(59.1578 49.6699) rotate(90.1003) scale(81.1448 83.858)">
        <stop stopColor="#FFED85"/>
        <stop offset="0.1898" stopColor="#FFE180"/>
        <stop offset="0.5295" stopColor="#FFC273"/>
        <stop offset="0.9773" stopColor="#FF915E"/>
        <stop offset="1" stopColor="#FF8E5D"/>
      </radialGradient>
      <radialGradient id="wow_gradient2" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(32.7622 29.73) scale(99.9228 99.9228)">
        <stop stopColor="#FFEA84" stopOpacity="0"/>
        <stop offset="1" stopColor="#F08423" stopOpacity="0.34"/>
      </radialGradient>
      <linearGradient id="wow_mouth" x1="59.9981" y1="59.6782" x2="59.9981" y2="104.401" gradientUnits="userSpaceOnUse">
        <stop stopColor="#3F1D04"/>
        <stop offset="1" stopColor="#7E2307"/>
      </linearGradient>
      <radialGradient id="wow_eye_right" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(82.9203 42.8993) scale(10.7262 10.7262)">
        <stop stopColor="#2C445F"/>
        <stop offset="0.9792" stopColor="#191A33"/>
      </radialGradient>
      <radialGradient id="wow_eye_left" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(37.193 42.8993) rotate(180) scale(10.7262 10.7262)">
        <stop stopColor="#2C445F"/>
        <stop offset="0.9792" stopColor="#191A33"/>
      </radialGradient>
    </defs>
  </svg>
);

// Sad (Crying) - Yellow/orange gradient with tear
export const SadIcon = ({ size = 24, className = '' }: ReactionIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path d="M120 59.9999C120 93.1498 93.1498 120 59.9999 120C26.8499 120 0 93.1498 0 59.9999C0 26.85 26.8499 0 59.9999 0C93.1498 0 120 27 120 59.9999Z" fill="url(#sad_gradient1)"/>
    <path d="M120 59.9999C120 93.1498 93.1498 120 59.9999 120C26.8499 120 0 93.1498 0 59.9999C0 26.85 26.8499 0 59.9999 0C93.1498 0 120 27 120 59.9999Z" fill="url(#sad_gradient2)"/>
    <path d="M43.1992 93.5998C43.1992 94.4998 43.7992 95.0998 44.6992 95.0998C46.9492 95.0998 49.9492 91.0498 59.8492 91.0498C69.7491 91.0498 72.8992 95.0998 74.9992 95.0998C76.0492 95.0998 76.4992 94.4998 76.4992 93.5998C76.4992 91.0498 71.2492 82.0498 59.6992 82.0498C48.5992 82.0498 43.1992 90.8998 43.1992 93.5998Z" fill="url(#sad_mouth)"/>
    {/* Tear drop */}
    <path d="M10.6491 110.25C5.54913 105.15 5.09917 96.8998 9.74916 91.1998L19.4991 79.4998C19.9491 78.8998 20.9991 78.8998 21.4491 79.4998L31.1991 91.1998C35.8491 96.7498 35.549 105 30.299 110.25C25.0491 115.8 16.1991 115.8 10.6491 110.25Z" fill="url(#sad_tear1)"/>
    <path d="M20.5492 112.5C17.2492 112.5 14.2492 111.3 11.8492 108.9C7.3492 104.4 7.0492 97.3501 11.0992 92.4001L20.5492 81.1501L29.9992 92.4001C34.0492 97.3501 33.7492 104.4 29.2492 108.9C26.9992 111.3 23.8491 112.5 20.5492 112.5Z" fill="url(#sad_tear2)"/>
    <path d="M76.498 67.1997C76.498 60.8997 80.698 55.9497 85.798 55.9497C90.8979 55.9497 95.098 61.0497 95.098 67.1997C95.098 69.7497 94.348 72.1497 93.148 74.0997C92.848 74.5497 92.548 74.8497 92.098 75.1497C91.648 75.4497 91.198 75.5997 90.748 75.7497C87.598 76.4997 84.148 76.4997 80.998 75.7497C80.548 75.5997 79.948 75.4497 79.648 75.1497C79.198 74.8497 78.898 74.5497 78.598 74.0997C77.098 71.9997 76.498 69.5997 76.498 67.1997Z" fill="url(#sad_eye_right)"/>
    <path d="M84.4507 60.1497C85.5007 61.3497 85.5007 63.7497 84.6007 65.5497C83.7007 67.3497 82.0507 67.6497 81.0007 66.4497C79.9507 65.2497 79.9507 62.8497 80.8507 61.0497C81.7507 59.2497 83.4007 58.9497 84.4507 60.1497Z" fill="#4E506A"/>
    <path d="M43.6488 67.1997C43.6488 60.8997 39.4488 55.9497 34.3488 55.9497C29.2488 55.9497 25.0488 61.0497 25.0488 67.1997C25.0488 69.7497 25.7989 72.1497 26.9989 74.0997C27.2989 74.5497 27.5988 74.8497 28.0488 75.1497C28.4988 75.4497 28.9489 75.5997 29.3989 75.7497C32.5488 76.4997 35.9988 76.4997 39.1488 75.7497C39.5988 75.5997 40.1989 75.4497 40.4989 75.1497C40.9489 74.8497 41.2488 74.5497 41.5488 74.0997C42.8988 71.9997 43.6488 69.5997 43.6488 67.1997Z" fill="url(#sad_eye_left)"/>
    <path d="M30.0007 60.1497C28.9507 61.3497 28.9507 63.7497 29.8507 65.5497C30.7507 67.3497 32.4007 67.6497 33.4507 66.4497C34.5007 65.2497 34.5007 62.8497 33.6007 61.0497C32.7007 59.2497 31.0507 58.9497 30.0007 60.1497Z" fill="#4E506A"/>
    <path d="M82.0486 40.0502C90.4485 41.8502 95.2486 45.9002 100.649 51.3002C102.449 53.1002 100.049 56.5502 97.7985 54.4502C94.1985 51.1502 89.3986 47.5502 81.1486 45.9002C76.9486 45.0002 78.5986 39.3002 82.0486 40.0502Z" fill="url(#sad_brow_right)"/>
    <path d="M37.9494 40.0502C29.5494 41.8502 24.7494 45.9002 19.3494 51.3002C17.5494 53.1002 19.9494 56.5502 22.1994 54.4502C25.7994 51.1502 30.5994 47.5502 38.8494 45.9002C43.0494 45.0002 41.3994 39.3002 37.9494 40.0502Z" fill="url(#sad_brow_left)"/>
    <defs>
      <radialGradient id="sad_gradient1" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(60.0584 27.0733) rotate(90.1003) scale(92.9773 133.486)">
        <stop stopColor="#FFED85"/>
        <stop offset="0.1898" stopColor="#FFE180"/>
        <stop offset="0.5295" stopColor="#FFC273"/>
        <stop offset="0.9773" stopColor="#FF915E"/>
        <stop offset="1" stopColor="#FF8E5D"/>
      </radialGradient>
      <radialGradient id="sad_gradient2" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(32.7396 29.7385) scale(99.9021 99.9021)">
        <stop stopColor="#FFEA84" stopOpacity="0"/>
        <stop offset="1" stopColor="#F08423" stopOpacity="0.34"/>
      </radialGradient>
      <linearGradient id="sad_mouth" x1="59.9734" y1="82.0513" x2="59.8311" y2="95.2637" gradientUnits="userSpaceOnUse">
        <stop stopColor="#3F1D04"/>
        <stop offset="1" stopColor="#7E2307"/>
      </linearGradient>
      <linearGradient id="sad_tear1" x1="20.5002" y1="114.363" x2="20.5002" y2="79.0402" gradientUnits="userSpaceOnUse">
        <stop stopColor="#20BBF2"/>
        <stop offset="1" stopColor="#007EDB"/>
      </linearGradient>
      <radialGradient id="sad_tear2" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(19.7889 105.519) scale(23.1402 23.1402)">
        <stop offset="0.0961217" stopColor="#2FD7FC"/>
        <stop offset="1" stopColor="#007EDB"/>
      </radialGradient>
      <radialGradient id="sad_eye_right" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(85.6435 68.3406) rotate(90) scale(11.4648 12.2507)">
        <stop stopColor="#3B426A"/>
        <stop offset="0.9792" stopColor="#191A33"/>
      </radialGradient>
      <radialGradient id="sad_eye_left" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(34.391 68.3406) rotate(90) scale(11.4648 12.2507)">
        <stop stopColor="#3B426A"/>
        <stop offset="0.9792" stopColor="#191A33"/>
      </radialGradient>
      <linearGradient id="sad_brow_right" x1="89.9657" y1="37.0589" x2="89.9657" y2="54.0427" gradientUnits="userSpaceOnUse">
        <stop stopColor="#E78E0D"/>
        <stop offset="1" stopColor="#CB6000"/>
      </linearGradient>
      <linearGradient id="sad_brow_left" x1="30.0321" y1="37.0589" x2="30.0321" y2="54.0427" gradientUnits="userSpaceOnUse">
        <stop stopColor="#E78E0D"/>
        <stop offset="1" stopColor="#CB6000"/>
      </linearGradient>
    </defs>
  </svg>
);

// Angry - Red/orange gradient
export const AngryIcon = ({ size = 24, className = '' }: ReactionIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path d="M120 59.9999C120 93.1498 93.1498 120 59.9999 120C26.8499 120 0 93.1498 0 59.9999C0 26.85 26.8499 0 59.9999 0C93.1498 0 120 26.85 120 59.9999Z" fill="url(#angry_gradient)"/>
    <path d="M44.0996 92.2494C44.0996 95.5494 51.1496 94.9494 59.9996 94.9494C68.6996 94.9494 75.8996 95.3994 75.8996 92.2494C75.8996 88.3494 68.8496 85.6494 59.9996 85.6494C51.1496 85.7994 44.0996 88.3494 44.0996 92.2494Z" fill="url(#angry_mouth)"/>
    <path d="M25.3516 68.2497C25.3516 61.4997 30.0016 55.9497 35.8515 55.9497C41.7015 55.9497 46.3515 61.4997 46.3515 68.2497C46.3515 71.0997 45.6015 73.6497 44.1015 75.7497C43.5015 76.6497 42.4516 77.3997 41.2516 77.6997C39.9016 77.9997 37.9516 78.2997 35.7016 78.2997C33.4516 78.2997 31.5016 77.9997 30.1516 77.6997C28.9516 77.3997 28.0516 76.7997 27.3016 75.7497C26.1016 73.4997 25.3516 70.9497 25.3516 68.2497Z" fill="url(#angry_eye_left)"/>
    <path d="M73.502 68.2497C73.502 61.4997 78.1519 55.9497 84.0019 55.9497C89.8519 55.9497 94.5019 61.4997 94.5019 68.2497C94.5019 71.0997 93.6019 73.6497 92.2519 75.7497C91.6519 76.6497 90.6019 77.3997 89.4019 77.6997C87.6019 78.1497 85.8019 78.2997 83.8519 78.2997C81.6019 78.2997 79.652 77.9997 78.302 77.6997C77.102 77.3997 76.2019 76.7997 75.4519 75.7497C74.2519 73.4997 73.502 70.9497 73.502 68.2497Z" fill="url(#angry_eye_right)"/>
    <path d="M37.2012 64.4997C37.2012 64.6497 37.2012 64.7997 37.2012 65.0997C37.2012 66.5997 35.8512 67.7997 34.2012 67.7997C32.5512 67.7997 31.2012 66.5997 31.2012 65.0997C31.2012 64.4997 31.3512 63.8997 31.8012 63.4497C33.6012 63.7497 35.4012 64.0497 37.2012 64.4997Z" fill="#4F4F67"/>
    <path d="M81.6016 67.7997C79.9516 67.7997 78.7516 66.5997 78.6016 65.2497C80.5516 64.9497 82.5016 64.6497 84.3016 64.1997C84.4516 64.4997 84.4516 64.7997 84.4516 65.0997C84.6016 66.4497 83.2516 67.7997 81.6016 67.7997Z" fill="#4F4F67"/>
    <path d="M49.5022 56.8504C52.8021 57.1504 52.2021 63.0004 49.3521 63.0004C37.3521 61.6504 25.9522 58.2004 21.3022 55.9504C19.8022 55.2004 19.3522 54.1504 19.6522 52.9504C19.9522 51.6004 21.3022 50.7004 22.0522 51.0004C33.7522 54.1504 37.9522 55.6504 49.5022 56.8504Z" fill="url(#angry_brow_left)"/>
    <path d="M70.353 56.8504C67.053 57.1504 67.6531 63.0004 70.5031 63.0004C82.5031 61.6504 93.9031 58.2004 98.553 55.9504C100.053 55.2004 100.503 54.1504 100.203 52.9504C99.903 51.6004 98.553 50.7004 97.803 51.0004C86.2531 54.1504 82.053 55.6504 70.353 56.8504Z" fill="url(#angry_brow_right)"/>
    <defs>
      <radialGradient id="angry_gradient" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(42.0603 40.1242) rotate(76.293) scale(78.6551 78.6551)">
        <stop stopColor="#FFB06C"/>
        <stop offset="1" stopColor="#FD4545"/>
      </radialGradient>
      <linearGradient id="angry_mouth" x1="59.9996" y1="87.027" x2="59.9996" y2="95.0839" gradientUnits="userSpaceOnUse">
        <stop stopColor="#3F1D04"/>
        <stop offset="1" stopColor="#7E2307"/>
      </linearGradient>
      <radialGradient id="angry_eye_left" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(35.8889 67.1247) scale(10.8563 10.8563)">
        <stop stopColor="#2C445F"/>
        <stop offset="0.9792" stopColor="#191A33"/>
      </radialGradient>
      <radialGradient id="angry_eye_right" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(84.1094 67.1248) scale(10.864 10.864)">
        <stop stopColor="#2C445F"/>
        <stop offset="0.9792" stopColor="#191A33"/>
      </radialGradient>
      <linearGradient id="angry_brow_left" x1="35.6533" y1="64.4563" x2="35.6533" y2="46.9588" gradientUnits="userSpaceOnUse">
        <stop stopColor="#9A2F00"/>
        <stop offset="1" stopColor="#D44800"/>
      </linearGradient>
      <linearGradient id="angry_brow_right" x1="84.2019" y1="64.4563" x2="84.2019" y2="46.9588" gradientUnits="userSpaceOnUse">
        <stop stopColor="#9A2F00"/>
        <stop offset="1" stopColor="#D44800"/>
      </linearGradient>
    </defs>
  </svg>
);

// Care (Hug) - Yellow with red heart
export const CareIcon = ({ size = 24, className = '' }: ReactionIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path fillRule="evenodd" clipRule="evenodd" d="M120.001 59.9999C120.001 92.9998 93.0019 120 60.0026 120C27.0033 120 0.00390625 92.9998 0.00390625 59.9999C0.00390625 27 27.0033 0 60.0026 0C93.0019 0 120.001 27 120.001 59.9999Z" fill="url(#care_gradient1)"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M120.001 59.9999C120.001 92.9998 93.0019 120 60.0026 120C27.0033 120 0.00390625 92.9998 0.00390625 59.9999C0.00390625 27 27.0033 0 60.0026 0C93.0019 0 120.001 27 120.001 59.9999Z" fill="url(#care_gradient2)"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M72.7502 44.25C72.0002 42 48.0007 42 47.2507 44.25C46.5008 46.5 51.7507 49.5 60.0005 49.5C68.2503 49.5 73.5002 46.5 72.7502 44.25Z" fill="url(#care_mouth)"/>
    {/* Heart hugging hands */}
    <path fillRule="evenodd" clipRule="evenodd" d="M72.7509 63.7502C57.0012 59.2502 51.7513 69.7502 51.7513 69.7502C51.7513 69.7502 53.2513 57.7502 37.5016 52.5002C22.502 48.0002 13.5022 62.2502 12.7522 70.5002C11.2522 89.2501 27.7518 110.25 33.7517 117.75C34.5017 120 36.7516 120 39.0016 120C48.0014 117.75 73.5008 109.5 83.2506 93.0001C87.0006 84.7501 87.7505 68.2502 72.7509 63.7502Z" fill="url(#care_heart1)"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M72.7509 63.7502C57.0012 59.2502 51.7513 69.7502 51.7513 69.7502C51.7513 69.7502 53.2513 57.7502 37.5016 52.5002C22.502 48.0002 13.5022 62.2502 12.7522 70.5002C11.2522 89.2501 27.7518 110.25 33.7517 117.75C34.5017 120 36.7516 120 39.0016 120C48.0014 117.75 73.5008 109.5 83.2506 93.0001C87.0006 84.7501 87.7505 68.2502 72.7509 63.7502Z" fill="url(#care_heart2)"/>
    {/* Hands */}
    <path fillRule="evenodd" clipRule="evenodd" d="M36.0014 73.4998C36.0014 73.4998 36.0014 73.4998 36.0014 72.7498C36.7513 71.9998 38.2513 71.2498 39.0013 70.4998C42.0012 68.2498 40.5013 64.4998 36.7513 65.2498C36.0014 65.2498 27.0016 68.2498 21.0017 65.9998C15.0018 63.7498 14.2518 61.4998 9.75193 57.7498C7.05199 55.0498 2.5521 53.0998 0.152151 55.7998C-0.447836 64.1998 0.752101 72.1498 3.30205 79.6498C4.80201 82.0498 6.602 84.2998 9.00195 86.2498C30.0015 102.75 48.7511 93.7497 49.5011 81.7498C50.2511 72.7498 39.0013 73.4998 36.0014 73.4998Z" fill="url(#care_hand_left)"/>
    <path d="M120.003 59.9998C118.353 56.2499 110.103 52.9499 107.253 58.6498C101.253 69.8998 99.0033 81.1498 84.7536 82.6498C80.2537 83.3998 74.2538 81.8998 69.7539 81.1498C66.004 80.3998 65.254 84.8998 68.254 87.1498C69.7539 87.8998 70.5039 88.6498 72.0039 89.3998V90.1498C68.254 90.1498 57.7542 91.6498 60.0042 100.65C62.5541 111.15 85.0536 114.75 102.303 102.6C113.253 91.6498 120.003 76.6498 120.003 59.9998Z" fill="url(#care_hand_right)"/>
    {/* Eyes */}
    <path fillRule="evenodd" clipRule="evenodd" d="M75.4473 31.0508C75.4473 36.3008 78.4472 37.8007 82.9471 38.5507C87.447 39.3007 91.1969 37.0508 91.1969 31.0508C91.1969 26.5508 88.947 20.5508 82.9471 20.5508C77.6972 20.5508 75.4473 26.5508 75.4473 31.0508Z" fill="url(#care_eye_right)"/>
    <path d="M81.0003 29.8506C82.5743 29.8506 83.8502 28.5746 83.8502 27.0006C83.8502 25.4266 82.5743 24.1506 81.0003 24.1506C79.4263 24.1506 78.1504 25.4266 78.1504 27.0006C78.1504 28.5746 79.4263 29.8506 81.0003 29.8506Z" fill="#4E506A"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M44.0993 31.0508C44.0993 36.3008 41.0993 37.8007 36.5994 38.5507C32.0995 39.3007 28.3496 37.0508 28.3496 31.0508C28.3496 26.5508 30.5996 20.5508 36.5994 20.5508C41.8493 20.5508 44.0993 26.5508 44.0993 31.0508Z" fill="url(#care_eye_left)"/>
    <path d="M33.0003 29.8506C34.5743 29.8506 35.8502 28.5746 35.8502 27.0006C35.8502 25.4266 34.5743 24.1506 33.0003 24.1506C31.4263 24.1506 30.1504 25.4266 30.1504 27.0006C30.1504 28.5746 31.4263 29.8506 33.0003 29.8506Z" fill="#4E506A"/>
    {/* Eyebrows */}
    <path fillRule="evenodd" clipRule="evenodd" d="M76.8027 9.44983C73.2028 10.0498 73.0528 14.8498 75.9027 14.8498C83.4026 14.8498 89.8524 17.5498 93.0024 19.9498C95.5523 21.5998 96.7523 18.2998 95.5523 16.6498C91.6524 11.8498 83.1026 8.39983 76.8027 9.44983Z" fill="url(#care_brow_right)"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M42.7546 9.44983C46.3545 10.0498 46.5045 14.8498 43.6546 14.8498C36.1548 14.8498 29.7049 17.5498 26.5549 19.9498C24.005 21.5998 22.8051 18.2998 24.005 16.6498C28.0549 11.8498 36.4548 8.39983 42.7546 9.44983Z" fill="url(#care_brow_left)"/>
    <defs>
      <radialGradient id="care_gradient1" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(47.6957 31.1383) scale(89.5206 89.5224)">
        <stop stopColor="#FFED85"/>
        <stop offset="0.1898" stopColor="#FFE180"/>
        <stop offset="0.5295" stopColor="#FFC273"/>
        <stop offset="0.9773" stopColor="#FF915E"/>
        <stop offset="1" stopColor="#FF8E5D"/>
      </radialGradient>
      <radialGradient id="care_gradient2" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(47.9312 35.3752) scale(55.7262 55.7273)">
        <stop stopColor="#FFEA84" stopOpacity="0"/>
        <stop offset="1" stopColor="#F08423" stopOpacity="0.34"/>
      </radialGradient>
      <linearGradient id="care_mouth" x1="60.0005" y1="49.5486" x2="60.0005" y2="42.6111" gradientUnits="userSpaceOnUse">
        <stop stopColor="#3F1D04"/>
        <stop offset="1" stopColor="#7E2307"/>
      </linearGradient>
      <linearGradient id="care_heart1" x1="50.5869" y1="73.1189" x2="35.3569" y2="122.185" gradientUnits="userSpaceOnUse">
        <stop stopColor="#F34462"/>
        <stop offset="1" stopColor="#CC0820"/>
      </linearGradient>
      <radialGradient id="care_heart2" cx="0" cy="0" r="1" gradientTransform="matrix(18.5091 6.88096 -6.88083 18.5094 66.4004 82.0926)" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FF7091" stopOpacity="0.7"/>
        <stop offset="1" stopColor="#FE6D8E" stopOpacity="0"/>
      </radialGradient>
      <radialGradient id="care_hand_left" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(-1.19242 56.0298) scale(53.2287 53.2298)">
        <stop stopColor="#FF9F64"/>
        <stop offset="1" stopColor="#FFE682"/>
      </radialGradient>
      <radialGradient id="care_hand_right" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(115.486 62.4255) scale(68.4645 68.4659)">
        <stop stopColor="#FF9F64"/>
        <stop offset="1" stopColor="#FFE682"/>
      </radialGradient>
      <radialGradient id="care_eye_right" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(83.06 32.3302) rotate(-90) scale(13.9473 13.9478)">
        <stop stopColor="#3B426A"/>
        <stop offset="0.9792" stopColor="#191A33"/>
      </radialGradient>
      <radialGradient id="care_eye_left" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(36.5441 32.3302) rotate(-90) scale(13.9473 13.9478)">
        <stop stopColor="#3B426A"/>
        <stop offset="0.9792" stopColor="#191A33"/>
      </radialGradient>
      <radialGradient id="care_brow_right" cx="0" cy="0" r="1" gradientTransform="matrix(0.511506 -3.39725 15.959 2.40291 84.3526 12.247)" gradientUnits="userSpaceOnUse">
        <stop stopColor="#E38200"/>
        <stop offset="1" stopColor="#D16C00"/>
      </radialGradient>
      <radialGradient id="care_brow_left" cx="0" cy="0" r="1" gradientTransform="matrix(-0.511506 -3.39725 -15.959 2.40291 35.2625 12.2473)" gradientUnits="userSpaceOnUse">
        <stop stopColor="#E38200"/>
        <stop offset="1" stopColor="#D16C00"/>
      </radialGradient>
    </defs>
  </svg>
);

// Map reaction types to icons
export const ReactionIconMap = {
  LIKE: LikeIcon,
  LOVE: LoveIcon,
  HAHA: HahaIcon,
  WOW: WowIcon,
  SAD: SadIcon,
  ANGRY: AngryIcon,
  CARE: CareIcon,
};

// Helper component to render reaction icon by type
type ReactionIconByTypeProps = {
  type: keyof typeof ReactionIconMap;
  size?: number;
  className?: string;
};

export const ReactionIcon = ({ type, size = 24, className = '' }: ReactionIconByTypeProps) => {
  const IconComponent = ReactionIconMap[type];
  if (!IconComponent) return null;
  return <IconComponent size={size} className={className} />;
};

export default ReactionIcon;

