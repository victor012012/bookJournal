import { useEffect, useState, useMemo } from "react";
import { Button, Col, Input, Row } from "reactstrap";
import "./index.css";
import BookForm from "./BookForm";
import Stars from "./Stars";

const ITEMS_PER_PAGE = 12;

export default function LibraryPage() {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState<boolean>(false);
  const [selectedInitial, setSelectedInitial] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Load books from JSON
  const loadBooks = async () => {
    setLoading(true);
    try {
      const data = await window.api.loadJSON();
      setBooks(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to load books:", e);
      setBooks([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadBooks();
  }, []);

  // Reload books when form closes
  const handleFormClose = () => {
    setOpenForm(false);
    setSelectedInitial(null);
    if (window.location.hash === "#/book/new") window.location.hash = "";
    loadBooks(); // Refresh the list
  };

  // Filter books by search query
  const filteredBooks = useMemo(() => {
    if (!searchQuery.trim()) return books;
    const query = searchQuery.toLowerCase();
    return books.filter((book) =>
      (book.title || "").toLowerCase().includes(query)
    );
  }, [books, searchQuery]);

  // Pagination logic
  const totalPages = Math.ceil(filteredBooks.length / ITEMS_PER_PAGE);
  const paginatedBooks = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredBooks.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredBooks, currentPage]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // listen for open requests (hash or event) and show page
  useEffect(() => {
    const handler = () => setOpenForm(true);
    const hashHandler = () => {
      if (window.location.hash === "#/book/new") setOpenForm(true);
      else setOpenForm(false);
    };
    window.addEventListener("openBookForm", handler as EventListener);
    window.addEventListener("hashchange", hashHandler);
    if (window.location.hash === "#/book/new") setOpenForm(true);
    return () => {
      window.removeEventListener("openBookForm", handler as EventListener);
      window.removeEventListener("hashchange", hashHandler);
    };
  }, []);

  const openBookForEdit = (book: any) => {
    setSelectedInitial(book);
    setOpenForm(true);
    window.location.hash = "#/book/new";
  };

  const openNewBook = () => {
    setSelectedInitial(null);
    window.location.hash = "#/book/new";
    const ev = new CustomEvent("openBookForm");
    window.dispatchEvent(ev);
  };

  return (
    <div className="h-100 overflow-auto px-4 library-scroll library-page">
      {!openForm && (
        <Row className="my-3 align-items-center mx-0 library-header">
          <Col sm={3} lg={3} xs={12} xl={3}>
            <h2 className="library-title">BOOK&nbsp;LIBRARY</h2>
          </Col>
          <Col sm={7} lg={7} xs={12} className="d-flex justify-content-center align-items-center">
            <Input
              placeholder="Search by title..."
              className="input-line library-search"
              style={{ color: "white" }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </Col>
          <Col sm={2} lg={2} xs={12} className="d-flex justify-content-center align-items-center">
            <Button
              color="transparent"
              className="library-add-btn"
              onClick={openNewBook}
            >
              <span className="library-add-icon">+</span>
            </Button>
          </Col>
        </Row>
      )}
      {openForm ? (
        <BookForm
          onClose={handleFormClose}
          initialData={selectedInitial ?? undefined}
        />
      ) : (
        <>
          {loading ? (
            <div className="text-center text-white py-5">Loading...</div>
          ) : filteredBooks.length === 0 ? (
            <div className="text-center text-white py-5">
              {searchQuery ? "No books found matching your search." : "No books yet. Click + to add your first book!"}
            </div>
          ) : (
            <>
              <Row className="my-3 mx-0 library-grid">
                {paginatedBooks.map((book) => (
                  <Col sm={6} lg={3} xs={12} xl={3} key={book.id} className="library-card-col">
                    <div className="library-card">
                      <div className="library-cover" onClick={() => openBookForEdit(book)}>
                        {book.coverUrl ? (
                          <img
                            src={book.coverUrl}
                            alt={book.title || "Book cover"}
                            className="library-cover-img"
                          />
                        ) : (
                          <div className="library-cover-placeholder">
                            <span>{book.title?.[0]?.toUpperCase() || "?"}</span>
                          </div>
                        )}
                      </div>

                      <div className="library-field-row">
                        <p className="library-field-label">Title</p>
                        <Input
                          value={book.title || "Untitled"}
                          className="text-center input-line library-field"
                          readOnly
                        />
                      </div>

                      <div className="library-field-row">
                        <p className="library-field-label">Author</p>
                        <Input
                          value={book.author || "Unknown"}
                          className="text-center input-line library-field"
                          readOnly
                        />
                      </div>

                      <div className="library-rating">
                        <Stars count={5} half={true} value={Number(book.rating) || 0} size={22} edit={false} color2="#ffd700" />
                      </div>
                      <span className="library-rating-text text-center">{book.rating || 0}/5</span>
                    </div>
                  </Col>
                ))}
              </Row>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="library-pagination">
                  <button
                    className="pagination-btn"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    ←
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      className={`pagination-btn ${currentPage === page ? "active" : ""}`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    className="pagination-btn"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  >
                    →
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
