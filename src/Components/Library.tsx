import { useEffect, useState } from "react";
import { Button, Col, Input, Row } from "reactstrap";
import ReactStars from "react-stars";
import "./index.css"
export default function LibraryPage() {

  const [datos, setDatos] = useState<any>(null);

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

  return (
    <div className="h-100 overflow-auto px-4 library-scroll">
        <Row className="my-3 align-items-end mx-0">
            <Col sm={3} lg={3} xs={3} xl={3}>
                 <h2 style={{color:"white"}}>
                    BOOK&nbsp;LIBRARY
                 </h2>
            </Col>
            <Col sm={7} lg={7} xs={7} className="d-flex justify-content-center align-items-center">
                 
                 <Input placeholder="Search..." className="input-line" style={{color:"white"}}/>
            </Col>
            <Col sm={2} lg={2} xs={2} className="d-flex justify-content-center align-items-center">
                 <Button color="transparent" style={{color:"white", width:70, border:"solid 1px white"}}>
                    <h1 style={{color:"white"}}>
                        +
                    </h1> 
                    </Button>
            </Col>
        </Row>
        <Row className="my-3 mx-0">
            {Array.from({ length: 12 }).map((_, index) => 
            {
                const star = (Math.random()*5).toFixed(1)
                
                return(
                <Col  sm={6} lg={3} xs={12} xl={3} key={index} className="">
                    <div className="d-flex ms-5 ps-2 justify-content-center align-items-center">

                    <img 
                        src={imageUrl + (Math.round( Math.random()*99))}
                        alt="Imagen"
                        style={{
                            borderRadius: 5,
                            width: "75%",
                            aspectRatio: "3 / 4",
                            objectFit: "fill",
                            boxShadow: "0 4px 10px rgba(0,0,0,0.25)"
                        }}
                        />
                        </div>

                    <div style={{ maxHeight: 40 }} className="d-flex gap-2 justify-content-center align-items-center">
                    <p className="mt-3" style={{ fontSize: 14 }}>Title:</p>
                    <Input value={"Book " + index} style={{ fontSize: 12 }} className="text-center input-line" />
                    </div>

                    <div style={{ maxHeight: 40 }} className="d-flex gap-2 justify-content-center align-items-center">
                    <p className="mt-3" style={{ fontSize: 14 }}>Autor:</p>
                    <Input value={"Autor " + index} style={{ fontSize: 12 }} className="text-center input-line" />
                    </div>

                    <div style={{ maxHeight: 40 }} className="ms-5 ps-2 d-flex justify-content-center align-items-center">
                    <ReactStars
                        count={5}
                        half={true}
                        value={star}
                        size={20}
                        activeColor="#ffd700"
                    />
                    </div>

                    <p style={{ marginTop: "-8px", fontSize: 12 }} className="ms-5 ps-2 text-center">{star}/5</p>
                </Col>
            )}
            
            )}


        </Row>
    </div>

  );
}
