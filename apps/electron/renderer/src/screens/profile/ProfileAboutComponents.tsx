type InlineField = {
  key: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
};

export const AboutItem = ({ icon, label, subLabel, isSelf, onEdit }: { icon: string; label: string; subLabel?: string; isSelf?: boolean; onEdit?: () => void }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid #3a3b3c" }}>
    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#3a3b3c", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
      {icon}
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 15, color: "#e4e6eb" }}>{label}</div>
      {subLabel && <div style={{ fontSize: 13, color: "#b0b3b8" }}>{subLabel}</div>}
    </div>
    {isSelf && onEdit && (
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={onEdit}
          style={{ width: 36, height: 36, borderRadius: "50%", background: "#3a3b3c", border: "none", color: "#e4e6eb", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}
          title="Chỉnh sửa"
        >
          ✏️
        </button>
        <button
          style={{ width: 36, height: 36, borderRadius: "50%", background: "#3a3b3c", border: "none", color: "#e4e6eb", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}
          title="Thêm tùy chọn"
        >
          ⋯
        </button>
      </div>
    )}
  </div>
);

export const AboutItemAdd = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <button
    onClick={onClick}
    style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "12px 0",
      background: "transparent",
      border: "none",
      cursor: "pointer",
      width: "100%",
      textAlign: "left",
    }}
  >
    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#3a3b3c", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: "#2374e1" }}>
      ➕
    </div>
    <span style={{ fontSize: 15, color: "#2374e1" }}>{label}</span>
  </button>
);

export const InlineEditForm = ({
  title,
  fields,
  onSave,
  onCancel,
}: {
  title: string;
  fields: InlineField[];
  onSave: () => void;
  onCancel: () => void;
}) => (
  <div style={{ background: "#242526", border: "1px solid #3a3b3c", borderRadius: 8, padding: 16, marginBottom: 8 }}>
    <h4 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 16px" }}>{title}</h4>
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {fields.map((field) => (
        <div key={field.key} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: 12, color: "#b0b3b8" }}>{field.label}</label>
          {field.multiline ? (
            <textarea
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              placeholder={field.placeholder}
              style={{
                background: "#3a3b3c",
                border: "1px solid #4e4f50",
                borderRadius: 6,
                padding: "10px 12px",
                color: "#e4e6eb",
                fontSize: 15,
                resize: "vertical",
                minHeight: 80,
                outline: "none",
              }}
            />
          ) : (
            <input
              type="text"
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              placeholder={field.placeholder}
              style={{
                background: "#3a3b3c",
                border: "1px solid #4e4f50",
                borderRadius: 6,
                padding: "10px 12px",
                color: "#e4e6eb",
                fontSize: 15,
                outline: "none",
              }}
            />
          )}
        </div>
      ))}
    </div>
    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
      <button
        onClick={onCancel}
        style={{
          padding: "8px 16px",
          background: "#3a3b3c",
          border: "none",
          borderRadius: 6,
          color: "#e4e6eb",
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Hủy
      </button>
      <button
        onClick={onSave}
        style={{
          padding: "8px 16px",
          background: "#2374e1",
          border: "none",
          borderRadius: 6,
          color: "#fff",
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Lưu
      </button>
    </div>
  </div>
);

