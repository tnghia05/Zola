import { useState } from "react";
import { AboutItem, AboutItemAdd, InlineEditForm } from "./ProfileAboutComponents";

interface ProfileAboutTabProps {
  user: any;
  isSelf: boolean;
  inlineForm: any;
  setInlineForm: (form: any) => void;
  editingField: string | null;
  setEditingField: (field: string | null) => void;
  saveInlineField: (fieldType: string) => Promise<void>;
  cancelInlineEdit: () => void;
}

export const ProfileAboutTab = ({
  user,
  isSelf,
  inlineForm,
  setInlineForm,
  editingField,
  setEditingField,
  saveInlineField,
  cancelInlineEdit,
}: ProfileAboutTabProps) => {
  const [aboutCategory, setAboutCategory] = useState<"overview" | "work" | "places" | "contact" | "relationship" | "details">("overview");

  return (
    <div className="profile-about-fb" style={{ display: "flex", gap: 0, background: "#242526", borderRadius: 8, overflow: "hidden" }}>
      {/* Sidebar categories */}
      <div className="profile-about-sidebar" style={{ width: 280, flexShrink: 0, borderRight: "1px solid #3a3b3c", padding: "16px 0" }}>
        <h3 style={{ padding: "0 16px 12px", margin: 0, fontSize: 20, fontWeight: 700 }}>Giới thiệu</h3>
        <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {[
            { key: "overview", label: "Tổng quan" },
            { key: "work", label: "Công việc và học vấn" },
            { key: "places", label: "Nơi từng sống" },
            { key: "contact", label: "Thông tin liên hệ và cơ bản" },
            { key: "relationship", label: "Gia đình và các mối quan hệ" },
            { key: "details", label: "Chi tiết về bạn" },
          ].map((cat) => (
            <button
              key={cat.key}
              onClick={() => setAboutCategory(cat.key as any)}
              style={{
                textAlign: "left",
                padding: "10px 16px",
                background: aboutCategory === cat.key ? "#3a3b3c" : "transparent",
                borderLeft: aboutCategory === cat.key ? "3px solid #2374e1" : "3px solid transparent",
                border: "none",
                color: aboutCategory === cat.key ? "#2374e1" : "#e4e6eb",
                fontSize: 15,
                fontWeight: aboutCategory === cat.key ? 600 : 400,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { if (aboutCategory !== cat.key) e.currentTarget.style.background = "#3a3b3c"; }}
              onMouseLeave={(e) => { if (aboutCategory !== cat.key) e.currentTarget.style.background = "transparent"; }}
            >
              {cat.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content area */}
      <div className="profile-about-content" style={{ flex: 1, padding: 16 }}>
        {/* Overview */}
        {aboutCategory === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {isSelf && !user.works?.length && (
              <AboutItemAdd label="Thêm nơi làm việc" onClick={() => { setAboutCategory("work"); setEditingField("work"); }} />
            )}
            {user.works && user.works.length > 0 && user.works.map((w: string, idx: number) => (
              <AboutItem key={idx} icon="💼" label={w} isSelf={isSelf} onEdit={() => { setAboutCategory("work"); setEditingField("work"); }} />
            ))}
            {user.colleges && user.colleges.length > 0 ? (
              user.colleges.map((c: string, idx: number) => (
                <AboutItem key={idx} icon="🎓" label={`Học tại ${c}`} subLabel="Đã bắt đầu" isSelf={isSelf} onEdit={() => { setAboutCategory("work"); setEditingField("college"); }} />
              ))
            ) : isSelf ? (
              <AboutItemAdd label="Thêm trường học" onClick={() => { setAboutCategory("work"); setEditingField("college"); }} />
            ) : null}
            {user.currentCity ? (
              <AboutItem icon="🏠" label={`Sống tại ${user.currentCity}`} isSelf={isSelf} onEdit={() => { setAboutCategory("places"); setInlineForm({ ...inlineForm, currentCity: user.currentCity }); setEditingField("currentCity"); }} />
            ) : isSelf ? (
              <AboutItemAdd label="Thêm thành phố hiện tại" onClick={() => { setAboutCategory("places"); setEditingField("currentCity"); }} />
            ) : null}
            {user.hometown ? (
              <AboutItem icon="📍" label={`Đến từ ${user.hometown}`} isSelf={isSelf} onEdit={() => { setAboutCategory("places"); setInlineForm({ ...inlineForm, hometown: user.hometown }); setEditingField("hometown"); }} />
            ) : isSelf ? (
              <AboutItemAdd label="Thêm quê quán" onClick={() => { setAboutCategory("places"); setEditingField("hometown"); }} />
            ) : null}
            {user.relationshipStatus ? (
              <AboutItem icon="❤️" label={user.relationshipStatus} isSelf={isSelf} onEdit={() => { setAboutCategory("relationship"); setInlineForm({ ...inlineForm, relationshipStatus: user.relationshipStatus }); setEditingField("relationship"); }} />
            ) : isSelf ? (
              <AboutItemAdd label="Thêm tình trạng mối quan hệ" onClick={() => { setAboutCategory("relationship"); setEditingField("relationship"); }} />
            ) : null}
            {user.phone && (
              <AboutItem icon="📞" label={user.phone} subLabel="Di động" isSelf={isSelf} onEdit={() => { setAboutCategory("contact"); setInlineForm({ ...inlineForm, phone: user.phone }); setEditingField("phone"); }} />
            )}
          </div>
        )}

        {/* Work & Education */}
        {aboutCategory === "work" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <h4 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 8px" }}>Công việc</h4>
            {user.works && user.works.length > 0 && user.works.map((w: string, idx: number) => (
              <AboutItem key={idx} icon="💼" label={w} isSelf={isSelf} onEdit={() => setEditingField("work")} />
            ))}
            {isSelf && editingField === "work" ? (
              <InlineEditForm
                title="Công việc"
                fields={[
                  { key: "work", label: "Công ty", placeholder: "Tên công ty", value: inlineForm.work, onChange: (v) => setInlineForm({ ...inlineForm, work: v }) },
                  { key: "workPosition", label: "Chức vụ", placeholder: "Vị trí công việc", value: inlineForm.workPosition, onChange: (v) => setInlineForm({ ...inlineForm, workPosition: v }) },
                  { key: "workCity", label: "Thành phố/Thị xã", placeholder: "Nơi làm việc", value: inlineForm.workCity, onChange: (v) => setInlineForm({ ...inlineForm, workCity: v }) },
                  { key: "workDescription", label: "Mô tả", placeholder: "Mô tả công việc", value: inlineForm.workDescription, onChange: (v) => setInlineForm({ ...inlineForm, workDescription: v }), multiline: true },
                ]}
                onSave={() => saveInlineField("work")}
                onCancel={cancelInlineEdit}
              />
            ) : isSelf ? (
              <AboutItemAdd label="Thêm nơi làm việc" onClick={() => setEditingField("work")} />
            ) : !user.works?.length && <div style={{ color: "#b0b3b8", fontSize: 14 }}>Chưa có thông tin</div>}

            <h4 style={{ fontSize: 17, fontWeight: 700, margin: "16px 0 8px" }}>Đại học</h4>
            {user.colleges && user.colleges.length > 0 && user.colleges.map((c: string, idx: number) => (
              <AboutItem key={idx} icon="🎓" label={c} isSelf={isSelf} onEdit={() => setEditingField("college")} />
            ))}
            {isSelf && editingField === "college" ? (
              <InlineEditForm
                title="Đại học"
                fields={[
                  { key: "college", label: "Trường", placeholder: "Tên trường đại học / cao đẳng", value: inlineForm.college, onChange: (v) => setInlineForm({ ...inlineForm, college: v }) },
                  { key: "collegeYear", label: "Năm bắt đầu", placeholder: "VD: 2020", value: inlineForm.collegeYear, onChange: (v) => setInlineForm({ ...inlineForm, collegeYear: v }) },
                ]}
                onSave={() => saveInlineField("college")}
                onCancel={cancelInlineEdit}
              />
            ) : isSelf ? (
              <AboutItemAdd label="Thêm trường cao đẳng/đại học" onClick={() => setEditingField("college")} />
            ) : !user.colleges?.length && <div style={{ color: "#b0b3b8", fontSize: 14 }}>Chưa có thông tin</div>}

            <h4 style={{ fontSize: 17, fontWeight: 700, margin: "16px 0 8px" }}>Trung học</h4>
            {user.highSchools && user.highSchools.length > 0 && user.highSchools.map((h: string, idx: number) => (
              <AboutItem key={idx} icon="🏫" label={h} isSelf={isSelf} onEdit={() => setEditingField("highSchool")} />
            ))}
            {isSelf && editingField === "highSchool" ? (
              <InlineEditForm
                title="Trung học"
                fields={[
                  { key: "highSchool", label: "Trường", placeholder: "Tên trường THPT", value: inlineForm.highSchool, onChange: (v) => setInlineForm({ ...inlineForm, highSchool: v }) },
                  { key: "highSchoolYear", label: "Năm bắt đầu", placeholder: "VD: 2017", value: inlineForm.highSchoolYear, onChange: (v) => setInlineForm({ ...inlineForm, highSchoolYear: v }) },
                ]}
                onSave={() => saveInlineField("highSchool")}
                onCancel={cancelInlineEdit}
              />
            ) : isSelf ? (
              <AboutItemAdd label="Thêm trường trung học" onClick={() => setEditingField("highSchool")} />
            ) : !user.highSchools?.length && <div style={{ color: "#b0b3b8", fontSize: 14 }}>Chưa có thông tin</div>}
          </div>
        )}

        {/* Places lived */}
        {aboutCategory === "places" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <h4 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 8px" }}>Nơi từng sống</h4>
            {user.currentCity && (
              <AboutItem icon="🏠" label={user.currentCity} subLabel="Thành phố hiện tại" isSelf={isSelf} onEdit={() => { setInlineForm({ ...inlineForm, currentCity: user.currentCity }); setEditingField("currentCity"); }} />
            )}
            {isSelf && editingField === "currentCity" ? (
              <InlineEditForm
                title="Thành phố hiện tại"
                fields={[
                  { key: "currentCity", label: "Thành phố", placeholder: "VD: Đà Nẵng", value: inlineForm.currentCity, onChange: (v) => setInlineForm({ ...inlineForm, currentCity: v }) },
                ]}
                onSave={() => saveInlineField("currentCity")}
                onCancel={cancelInlineEdit}
              />
            ) : isSelf && !user.currentCity ? (
              <AboutItemAdd label="Thêm thành phố hiện tại" onClick={() => setEditingField("currentCity")} />
            ) : !user.currentCity && <div style={{ color: "#b0b3b8", fontSize: 14 }}>Chưa có thông tin</div>}

            {user.hometown && (
              <AboutItem icon="📍" label={user.hometown} subLabel="Quê quán" isSelf={isSelf} onEdit={() => { setInlineForm({ ...inlineForm, hometown: user.hometown }); setEditingField("hometown"); }} />
            )}
            {isSelf && editingField === "hometown" ? (
              <InlineEditForm
                title="Quê quán"
                fields={[
                  { key: "hometown", label: "Quê quán", placeholder: "VD: Quảng Ninh, Vietnam", value: inlineForm.hometown, onChange: (v) => setInlineForm({ ...inlineForm, hometown: v }) },
                ]}
                onSave={() => saveInlineField("hometown")}
                onCancel={cancelInlineEdit}
              />
            ) : isSelf && !user.hometown ? (
              <AboutItemAdd label="Thêm quê quán" onClick={() => setEditingField("hometown")} />
            ) : null}
          </div>
        )}

        {/* Contact & basic info */}
        {aboutCategory === "contact" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <h4 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 8px" }}>Thông tin liên hệ</h4>
            {user.phone && (
              <AboutItem icon="📞" label={user.phone} subLabel="Di động" isSelf={isSelf} onEdit={() => { setInlineForm({ ...inlineForm, phone: user.phone }); setEditingField("phone"); }} />
            )}
            {isSelf && editingField === "phone" ? (
              <InlineEditForm
                title="Số điện thoại"
                fields={[
                  { key: "phone", label: "Số điện thoại", placeholder: "VD: 0901234567", value: inlineForm.phone, onChange: (v) => setInlineForm({ ...inlineForm, phone: v }) },
                ]}
                onSave={() => saveInlineField("phone")}
                onCancel={cancelInlineEdit}
              />
            ) : isSelf && !user.phone ? (
              <AboutItemAdd label="Thêm số điện thoại" onClick={() => setEditingField("phone")} />
            ) : !user.phone && <div style={{ color: "#b0b3b8", fontSize: 14 }}>Chưa có thông tin</div>}
            
            {user.email && (
              <AboutItem icon="📧" label={user.email} subLabel="Email" isSelf={false} />
            )}

            <h4 style={{ fontSize: 17, fontWeight: 700, margin: "16px 0 8px" }}>Trang web và liên kết xã hội</h4>
            {user.website && (
              <AboutItem icon="🔗" label={user.website} subLabel="Website" isSelf={isSelf} onEdit={() => { setInlineForm({ ...inlineForm, website: user.website }); setEditingField("website"); }} />
            )}
            {isSelf && editingField === "website" ? (
              <InlineEditForm
                title="Website"
                fields={[
                  { key: "website", label: "URL", placeholder: "https://yoursite.com", value: inlineForm.website, onChange: (v) => setInlineForm({ ...inlineForm, website: v }) },
                ]}
                onSave={() => saveInlineField("website")}
                onCancel={cancelInlineEdit}
              />
            ) : isSelf && !user.website ? (
              <AboutItemAdd label="Thêm website" onClick={() => setEditingField("website")} />
            ) : null}

            {user.instagram && (
              <AboutItem icon="📸" label={user.instagram} subLabel="Instagram" isSelf={isSelf} onEdit={() => { setInlineForm({ ...inlineForm, instagram: user.instagram }); setEditingField("instagram"); }} />
            )}
            {isSelf && editingField === "instagram" ? (
              <InlineEditForm
                title="Instagram"
                fields={[
                  { key: "instagram", label: "Username", placeholder: "@username", value: inlineForm.instagram, onChange: (v) => setInlineForm({ ...inlineForm, instagram: v }) },
                ]}
                onSave={() => saveInlineField("instagram")}
                onCancel={cancelInlineEdit}
              />
            ) : isSelf && !user.instagram ? (
              <AboutItemAdd label="Thêm Instagram" onClick={() => setEditingField("instagram")} />
            ) : null}

            {user.facebook && (
              <AboutItem icon="📘" label={user.facebook} subLabel="Facebook" isSelf={isSelf} onEdit={() => { setInlineForm({ ...inlineForm, facebook: user.facebook }); setEditingField("facebook"); }} />
            )}
            {isSelf && editingField === "facebook" ? (
              <InlineEditForm
                title="Facebook"
                fields={[
                  { key: "facebook", label: "Link Facebook", placeholder: "https://facebook.com/...", value: inlineForm.facebook, onChange: (v) => setInlineForm({ ...inlineForm, facebook: v }) },
                ]}
                onSave={() => saveInlineField("facebook")}
                onCancel={cancelInlineEdit}
              />
            ) : isSelf && !user.facebook ? (
              <AboutItemAdd label="Thêm Facebook" onClick={() => setEditingField("facebook")} />
            ) : null}
          </div>
        )}

        {/* Relationship */}
        {aboutCategory === "relationship" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <h4 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 8px" }}>Mối quan hệ</h4>
            {user.relationshipStatus && (
              <AboutItem icon="❤️" label={user.relationshipStatus} isSelf={isSelf} onEdit={() => { setInlineForm({ ...inlineForm, relationshipStatus: user.relationshipStatus }); setEditingField("relationship"); }} />
            )}
            {isSelf && editingField === "relationship" ? (
              <InlineEditForm
                title="Tình trạng mối quan hệ"
                fields={[
                  { key: "relationshipStatus", label: "Tình trạng", placeholder: "Độc thân / Hẹn hò / Đã kết hôn...", value: inlineForm.relationshipStatus, onChange: (v) => setInlineForm({ ...inlineForm, relationshipStatus: v }) },
                ]}
                onSave={() => saveInlineField("relationship")}
                onCancel={cancelInlineEdit}
              />
            ) : isSelf && !user.relationshipStatus ? (
              <AboutItemAdd label="Thêm tình trạng mối quan hệ" onClick={() => setEditingField("relationship")} />
            ) : !user.relationshipStatus && <div style={{ color: "#b0b3b8", fontSize: 14 }}>Chưa có thông tin</div>}
          </div>
        )}

        {/* Details about you */}
        {aboutCategory === "details" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <h4 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 8px" }}>Giới thiệu bản thân</h4>
            {user.bio && (
              <AboutItem icon="📝" label={user.bio} isSelf={isSelf} onEdit={() => { setInlineForm({ ...inlineForm, bio: user.bio }); setEditingField("bio"); }} />
            )}
            {isSelf && editingField === "bio" ? (
              <InlineEditForm
                title="Tiểu sử"
                fields={[
                  { key: "bio", label: "Giới thiệu về bạn", placeholder: "Mô tả ngắn về bản thân...", value: inlineForm.bio, onChange: (v) => setInlineForm({ ...inlineForm, bio: v }), multiline: true },
                ]}
                onSave={() => saveInlineField("bio")}
                onCancel={cancelInlineEdit}
              />
            ) : isSelf && !user.bio ? (
              <AboutItemAdd label="Thêm tiểu sử" onClick={() => setEditingField("bio")} />
            ) : !user.bio && <div style={{ color: "#b0b3b8", fontSize: 14 }}>Chưa có thông tin</div>}
          </div>
        )}
      </div>
    </div>
  );
};

