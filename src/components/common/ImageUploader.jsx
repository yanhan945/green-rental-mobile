import { useId, useRef } from "react";
import { GardenIcons } from "../../GardenIcons";

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ImageUploader({
  value,
  values,
  onChange,
  max = 1,
  label = "上传图片",
  helper = "支持手机拍照或从相册选择。",
  avatar = false,
  avatarActionLabel = "更换头像",
}) {
  const inputId = useId();
  const inputRef = useRef(null);
  const isMulti = Array.isArray(values);
  const list = isMulti
    ? [...values.slice(0, max), ...Array(Math.max(0, max - values.length)).fill("")]
    : [value || ""];

  const updateAt = (index, nextValue) => {
    if (typeof onChange !== "function") return;

    if (isMulti) {
      const next = list.map((item, itemIndex) => (itemIndex === index ? nextValue : item));
      onChange(next);
      return;
    }

    onChange(nextValue);
  };

  const handleFiles = async (event, index) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const dataUrl = await readFileAsDataUrl(file);
    // TODO: Replace local data URLs with cloud storage URLs when real account storage is connected.
    updateAt(index, dataUrl);
  };

  return (
    <div className={`image-uploader ${avatar ? "avatar-mode" : ""}`}>
      <div className="image-uploader-grid" style={{ "--upload-columns": max }}>
        {list.map((item, index) => {
          const fieldId = `${inputId}-${index}`;

          return (
            <div className="image-uploader-slot" key={fieldId}>
              <input
                ref={index === 0 ? inputRef : undefined}
                id={fieldId}
                className="image-uploader-input"
                type="file"
                accept="image/*"
                onChange={(event) => handleFiles(event, index)}
              />

              {item ? (
                <>
                  <div className="image-uploader-preview">
                    <img src={item} alt={avatar ? "头像预览" : `${label}预览`} />
                    {!avatar && (
                      <div className="image-uploader-actions">
                        <label htmlFor={fieldId}>
                          <GardenIcons.Camera size={15} />
                          <span>重传</span>
                        </label>
                        <button type="button" onClick={() => updateAt(index, "")}>
                          <GardenIcons.Close size={15} />
                          <span>删除</span>
                        </button>
                      </div>
                    )}
                  </div>
                  {avatar && (
                    <div className="image-uploader-avatar-actions">
                      <label htmlFor={fieldId}>
                        <GardenIcons.Camera size={14} />
                        <span>{avatarActionLabel}</span>
                      </label>
                    </div>
                  )}
                </>
              ) : (
                <label className="image-uploader-empty" htmlFor={fieldId}>
                  <GardenIcons.UploadPhoto size={avatar ? 24 : 22} />
                  <strong>{avatar ? avatarActionLabel : label}</strong>
                  {!avatar && <span>{max > 1 ? `${index + 1} / ${max}` : helper}</span>}
                </label>
              )}
            </div>
          );
        })}
      </div>

      {helper && !avatar && <p className="image-uploader-helper">{helper}</p>}
    </div>
  );
}
