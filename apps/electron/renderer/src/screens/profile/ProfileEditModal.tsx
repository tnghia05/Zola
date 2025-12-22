interface ProfileEditModalProps {
  show: boolean;
  onClose: () => void;
  profileForm: {
    bio: string;
    works: string;
    colleges: string;
    highSchools: string;
    currentCity: string;
    hometown: string;
    relationshipStatus: string;
    phone: string;
    instagram: string;
    facebook: string;
    website: string;
  };
  setProfileForm: (form: any) => void;
  onSave: () => Promise<void>;
}

export const ProfileEditModal = ({
  show,
  onClose,
  profileForm,
  setProfileForm,
  onSave,
}: ProfileEditModalProps) => {
  if (!show) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-panel" style={{ maxWidth: 720 }}>
        <div className="modal-header">
          <div className="modal-title">Chỉnh sửa chi tiết</div>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="modal-field">
            <label>Tiểu sử</label>
            <textarea
              value={profileForm.bio}
              onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
              placeholder="Giới thiệu ngắn"
            />
          </div>
          <div className="modal-field">
            <label>Nơi làm việc (mỗi dòng một mục)</label>
            <textarea
              value={profileForm.works}
              onChange={(e) => setProfileForm({ ...profileForm, works: e.target.value })}
              placeholder="Công ty A\nCông ty B"
            />
          </div>
          <div className="modal-field">
            <label>Đại học / Cao đẳng (mỗi dòng một mục)</label>
            <textarea
              value={profileForm.colleges}
              onChange={(e) => setProfileForm({ ...profileForm, colleges: e.target.value })}
              placeholder="Trường đại học ..."
            />
          </div>
          <div className="modal-field">
            <label>Trung học (mỗi dòng một mục)</label>
            <textarea
              value={profileForm.highSchools}
              onChange={(e) => setProfileForm({ ...profileForm, highSchools: e.target.value })}
              placeholder="Trường THPT ..."
            />
          </div>
          <div className="modal-field">
            <label>Nơi ở hiện tại</label>
            <input
              value={profileForm.currentCity}
              onChange={(e) => setProfileForm({ ...profileForm, currentCity: e.target.value })}
              placeholder="Đà Nẵng"
            />
          </div>
          <div className="modal-field">
            <label>Quê quán</label>
            <input
              value={profileForm.hometown}
              onChange={(e) => setProfileForm({ ...profileForm, hometown: e.target.value })}
              placeholder="Quê quán"
            />
          </div>
          <div className="modal-field">
            <label>Tình trạng mối quan hệ</label>
            <input
              value={profileForm.relationshipStatus}
              onChange={(e) => setProfileForm({ ...profileForm, relationshipStatus: e.target.value })}
              placeholder="Độc thân / Hẹn hò / ..."
            />
          </div>
          <div className="modal-field">
            <label>Điện thoại</label>
            <input
              value={profileForm.phone}
              onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              placeholder="Số điện thoại"
            />
          </div>
          <div className="modal-field">
            <label>Instagram</label>
            <input
              value={profileForm.instagram}
              onChange={(e) => setProfileForm({ ...profileForm, instagram: e.target.value })}
              placeholder="@username"
            />
          </div>
          <div className="modal-field">
            <label>Facebook</label>
            <input
              value={profileForm.facebook}
              onChange={(e) => setProfileForm({ ...profileForm, facebook: e.target.value })}
              placeholder="Link Facebook"
            />
          </div>
          <div className="modal-field">
            <label>Website</label>
            <input
              value={profileForm.website}
              onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
              placeholder="https://..."
            />
          </div>
        </div>
        <div className="modal-actions">
          <button className="modal-btn" onClick={onClose}>
            Hủy
          </button>
          <button className="modal-btn modal-btn--primary" onClick={onSave}>
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
};

