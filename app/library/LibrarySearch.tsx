export default function LibrarySearch() {
  return (
    <form className="site-search" action="/library/search" method="get">
      <label htmlFor="library-query">Tìm trong nguyên văn chữ Hán</label>
      <div>
        <input
          id="library-query"
          name="q"
          maxLength={160}
          placeholder="Ví dụ: 紫微"
          required
        />
        <button className="site-button" type="submit">
          Tìm kiếm
        </button>
      </div>
    </form>
  );
}
