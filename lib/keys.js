// Khoá chống trùng cho mỗi tin: "nguồn|id_gốc".
// Dùng thống nhất cho việc so khớp tin đã có trong DB.
export function itemKey(item) {
  return `${item.source}|${item.sourceId}`;
}
