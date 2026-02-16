import { useEffect, useState } from "react";
import { Button, Col, Input, Row } from "reactstrap";
import ReactStars from "react-stars";
import "./index.css";
import BookForm from "./BookForm";
import Stars from "./Stars";
export default function LibraryPage() {

  const [datos, setDatos] = useState<any>(null);
  const [openForm, setOpenForm] = useState<boolean>(false);
  const [selectedInitial, setSelectedInitial] = useState<any | null>(null);

  useEffect(() => {
    const cargar = async () => {
      const guardado = await window.api.loadJSON();
      setDatos(guardado);
    };
    cargar();
  }, []);



  const guardar = async () => {
    const miObjeto = { nombre: "Victor", tiempo: Date.now() };
    await window.api.saveJSON(miObjeto);
  };
  const imageUrl = "https://picsum.photos/3";

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

  return (
    <div className="h-100 overflow-auto px-4 library-scroll library-page">
      {!openForm && (
        <Row className="my-3 align-items-center mx-0 library-header">
          <Col sm={3} lg={3} xs={12} xl={3}>
            <h2 className="library-title">BOOK&nbsp;LIBRARY</h2>
          </Col>
          <Col sm={7} lg={7} xs={12} className="d-flex justify-content-center align-items-center">
            <Input
              placeholder="Search..."
              className="input-line library-search"
              style={{ color: "white" }}
            />
          </Col>
          <Col sm={2} lg={2} xs={12} className="d-flex justify-content-center align-items-center">
            <Button
              color="transparent"
              className="library-add-btn"
              onClick={() => {
                window.location.hash = "#/book/new";
                // show form via hash or state
                const ev = new CustomEvent("openBookForm");
                window.dispatchEvent(ev);
              }}
            >
              <span className="library-add-icon">+</span>
            </Button>
          </Col>
        </Row>
      )}
      {openForm ? (
        <BookForm
          onClose={() => {
            setOpenForm(false);
            setSelectedInitial(null);
            if (window.location.hash === "#/book/new") window.location.hash = "";
          }}
          initialData={selectedInitial ?? undefined}
        />
      ) : (
        <Row className="my-3 mx-0 library-grid">
        {Array.from({ length: 12 }).map((_, index) => {
          const star = Number((Math.random() * 5).toFixed(1));

          // deterministic cover id so the same image is used for card and form
          const coverId = (index * 37 + 13) % 100;
          const coverSrc = imageUrl + coverId;

          return (
            <Col sm={6} lg={3} xs={12} xl={3} key={index} className="library-card-col">
              <div className="library-card">
                <div className="library-cover" onClick={() => {
                  // open form with initial data matching this card
                  setSelectedInitial({ title: `Book ${index}`, author: `Autor ${index}`, coverUrl: coverSrc, rating: star });
                  setOpenForm(true);
                  window.location.hash = "#/book/new";
                }}>
                  <img
                    src={coverSrc}
                    alt="Imagen"
                    className="library-cover-img"
                  />
                </div>

                <div className="library-field-row">
                  <p className="library-field-label">Title</p>
                  <Input
                    value={"Book " + index}
                    className="text-center input-line library-field"
                    readOnly
                  />
                </div>

                <div className="library-field-row">
                  <p className="library-field-label">Autor</p>
                  <Input
                    value={"Autor " + index}
                    className="text-center input-line library-field"
                    readOnly
                  />
                </div>

                <div className="library-rating">
                  <Stars count={5} half={true} value={star} size={22} edit={false} color2="#ffd700" />
                </div>
                  <span className="library-rating-text text-center">{star}/5</span>
              </div>
            </Col>
          );
        })}
        </Row>
      )}
    </div>

  );
}
