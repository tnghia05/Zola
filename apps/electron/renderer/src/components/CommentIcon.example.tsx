/**
 * Ví dụ sử dụng CommentIcon với SVG file từ Figma
 * 
 * Sau khi export SVG từ Figma và lưu vào src/assets/icons/comment.svg,
 * bạn có thể dùng một trong các cách sau:
 */

// ============================================
// CÁCH 1: Import SVG file trực tiếp (Khuyến nghị)
// ============================================
// import commentSvg from '../assets/icons/comment.svg';
// 
// function CommentButton() {
//   return (
//     <button>
//       <img src={commentSvg} alt="Comment" width={20} height={20} />
//       <span>Bình luận</span>
//     </button>
//   );
// }

// ============================================
// CÁCH 2: Dùng component CommentIcon hiện tại
// ============================================
// import { CommentIcon } from './CommentIcon';
// 
// function CommentButton() {
//   return (
//     <button>
//       <CommentIcon size={20} color="#0966FF" />
//       <span>Bình luận</span>
//     </button>
//   );
// }

// ============================================
// CÁCH 3: Tạo component wrapper cho SVG file
// ============================================
// import commentSvg from '../assets/icons/comment.svg';
// 
// export const CommentIconFromFile = ({ size = 20 }: { size?: number }) => {
//   return (
//     <img 
//       src={commentSvg} 
//       alt="Comment" 
//       width={size} 
//       height={size}
//       style={{ 
//         display: 'inline-block',
//         verticalAlign: 'middle'
//       }}
//     />
//   );
// };

export {};

