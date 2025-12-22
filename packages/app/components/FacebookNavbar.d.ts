interface FacebookNavbarProps {
    currentUser?: {
        _id: string;
        name: string;
        avatar?: string;
    } | null;
}
/**
 * Facebook Desktop Header Design
 *
 * Design Philosophy: STRICT FACEBOOK DESKTOP CLONE
 * - Fixed 56px height header
 * - Dark theme (#242526 surface color)
 * - 3-section layout: Left (Logo + Search), Center (Navigation), Right (Actions + Profile)
 * - Clean, minimalist aesthetic matching Facebook's desktop interface
 */
export declare const FacebookNavbar: ({ currentUser }: FacebookNavbarProps) => import("react/jsx-runtime").JSX.Element;
export {};
