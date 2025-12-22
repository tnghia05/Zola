"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect } from "react";
import "../styles/feed.css";
export const AvatarCropModal = ({ imageFile, onClose, onSave }) => {
    const [imageSrc, setImageSrc] = useState("");
    const [zoom, setZoom] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const canvasRef = useRef(null);
    const imageRef = useRef(null);
    const containerRef = useRef(null);
    const CROP_SIZE = 400; // Size of the circular crop area
    const [minZoom, setMinZoom] = useState(0.5); // Allow zoom out
    const MAX_ZOOM = 3;
    useEffect(() => {
        if (!imageFile)
            return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const src = e.target?.result;
            setImageSrc(src);
            // Load image to get dimensions
            const img = new Image();
            img.onload = () => {
                imageRef.current = img;
                // Calculate minimum zoom to ensure image can cover the crop area if needed
                const scaleToCover = Math.max(CROP_SIZE / img.width, CROP_SIZE / img.height);
                // Set minimum zoom to cover the crop area (but start at 1.0)
                setMinZoom(Math.max(scaleToCover, 0.5)); // Allow zoom out to 0.5x
                // Start with original size (zoom = 1.0)
                setZoom(1.0);
                setPosition({ x: 0, y: 0 });
            };
            img.src = src;
        };
        reader.readAsDataURL(imageFile);
    }, [imageFile]);
    const handleMouseDown = (e) => {
        if (!containerRef.current)
            return;
        setIsDragging(true);
        const rect = containerRef.current.getBoundingClientRect();
        setDragStart({
            x: e.clientX - position.x,
            y: e.clientY - position.y,
        });
    };
    const handleMouseMove = (e) => {
        if (!isDragging || !containerRef.current)
            return;
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;
        setPosition({ x: newX, y: newY });
    };
    const handleMouseUp = () => {
        setIsDragging(false);
    };
    const handleZoomChange = (e) => {
        setZoom(parseFloat(e.target.value));
    };
    const getCroppedImage = () => {
        return new Promise((resolve, reject) => {
            if (!imageRef.current || !canvasRef.current || !containerRef.current) {
                reject(new Error("Image or container not loaded"));
                return;
            }
            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d");
            if (!ctx) {
                reject(new Error("Could not get canvas context"));
                return;
            }
            const img = imageRef.current;
            const containerRect = containerRef.current.getBoundingClientRect();
            canvas.width = CROP_SIZE;
            canvas.height = CROP_SIZE;
            // Clear canvas
            ctx.clearRect(0, 0, CROP_SIZE, CROP_SIZE);
            // Create circular clipping path
            ctx.beginPath();
            ctx.arc(CROP_SIZE / 2, CROP_SIZE / 2, CROP_SIZE / 2, 0, Math.PI * 2);
            ctx.clip();
            // Calculate the actual displayed image size
            const containerSize = CROP_SIZE; // Container is always CROP_SIZE
            const scaledWidth = img.width * zoom;
            const scaledHeight = img.height * zoom;
            // The image wrapper is centered in the container, then translated
            // Calculate where the scaled image is positioned relative to container
            const scaledImageLeft = (containerSize - scaledWidth) / 2 + position.x;
            const scaledImageTop = (containerSize - scaledHeight) / 2 + position.y;
            // The crop area is a circle centered at (containerSize/2, containerSize/2)
            // We need to find what part of the original image corresponds to this area
            // The crop area's top-left corner in container coordinates: (0, 0)
            // Convert to scaled image coordinates:
            const sourceX = 0 - scaledImageLeft;
            const sourceY = 0 - scaledImageTop;
            // Convert to original image coordinates:
            const originalX = sourceX / zoom;
            const originalY = sourceY / zoom;
            const originalWidth = containerSize / zoom;
            const originalHeight = containerSize / zoom;
            // Clamp to image bounds
            const clampedX = Math.max(0, Math.min(originalX, img.width - originalWidth));
            const clampedY = Math.max(0, Math.min(originalY, img.height - originalHeight));
            const clampedWidth = Math.min(originalWidth, img.width - clampedX);
            const clampedHeight = Math.min(originalHeight, img.height - clampedY);
            // Draw the cropped portion
            ctx.drawImage(img, clampedX, clampedY, clampedWidth, clampedHeight, 0, 0, CROP_SIZE, CROP_SIZE);
            // Convert to blob
            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob);
                }
                else {
                    reject(new Error("Failed to create blob"));
                }
            }, "image/png", 0.95);
        });
    };
    const handleSave = async () => {
        try {
            const blob = await getCroppedImage();
            onSave(blob);
            onClose();
        }
        catch (error) {
            console.error("Failed to crop image:", error);
            alert("Không thể cắt ảnh. Vui lòng thử lại.");
        }
    };
    if (!imageFile || !imageSrc)
        return null;
    return (_jsx("div", { className: "avatar-crop-modal-overlay", onClick: onClose, children: _jsxs("div", { className: "avatar-crop-modal", onClick: (e) => e.stopPropagation(), children: [_jsxs("div", { className: "avatar-crop-modal-header", children: [_jsx("h2", { children: "Ch\u1ECDn \u1EA3nh \u0111\u1EA1i di\u1EC7n" }), _jsx("button", { className: "avatar-crop-modal-close", onClick: onClose, children: "\u2715" })] }), _jsx("div", { className: "avatar-crop-container-wrapper", children: _jsxs("div", { ref: containerRef, className: "avatar-crop-container", onMouseDown: handleMouseDown, onMouseMove: handleMouseMove, onMouseUp: handleMouseUp, onMouseLeave: handleMouseUp, style: { cursor: isDragging ? "grabbing" : "grab" }, children: [_jsx("div", { className: "avatar-crop-image-wrapper", style: {
                                    transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px)) scale(${zoom})`,
                                    transition: isDragging ? "none" : "transform 0.1s ease-out",
                                }, children: _jsx("img", { src: imageSrc, alt: "Preview", className: "avatar-crop-preview-image", style: {
                                        width: imageRef.current ? `${imageRef.current.width}px` : 'auto',
                                        height: imageRef.current ? `${imageRef.current.height}px` : 'auto',
                                        display: 'block',
                                    } }) }), _jsx("div", { className: "avatar-crop-mask" })] }) }), _jsx("div", { className: "avatar-crop-controls", children: _jsxs("div", { className: "avatar-crop-zoom-control", children: [_jsx("span", { style: { fontSize: 12, color: "#b0b3b8" }, children: "\u2212" }), _jsx("input", { type: "range", min: minZoom, max: MAX_ZOOM, step: 0.1, value: zoom, onChange: handleZoomChange, className: "avatar-crop-zoom-slider" }), _jsx("span", { style: { fontSize: 16, color: "#b0b3b8" }, children: "+" })] }) }), _jsxs("div", { className: "avatar-crop-info", children: [_jsx("span", { style: { fontSize: 12, color: "#b0b3b8" }, children: "\uD83C\uDF10" }), _jsx("span", { style: { fontSize: 13, color: "#b0b3b8", marginLeft: 6 }, children: "\u1EA2nh \u0111\u1EA1i di\u1EC7n c\u1EE7a b\u1EA1n hi\u1EC3n th\u1ECB c\u00F4ng khai." })] }), _jsxs("div", { className: "avatar-crop-actions", children: [_jsx("button", { className: "avatar-crop-btn-cancel", onClick: onClose, children: "H\u1EE7y" }), _jsx("button", { className: "avatar-crop-btn-save", onClick: handleSave, children: "L\u01B0u" })] }), _jsx("canvas", { ref: canvasRef, style: { display: "none" } })] }) }));
};
