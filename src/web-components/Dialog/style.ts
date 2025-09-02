export const formContainerStyle = `
dialog {
  z-index: 9999;
  border: none;
  border-radius: 15px;
  background-color: #444;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  padding: 20px 30px !important;
}

dialog::backdrop {
  background: rgba(0,0,0,0.3);
}

dialog form {
  display: grid;
  row-gap: 5px;
  column-gap: 50px;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  margin-bottom: 20px;
}

dialog form > * {
  grid-column-start: span 1;
}

dialog input {
  background-color: #f0f0f0;
  color: #000;
  border: 3px solid #ccc;
  border-radius: 8px;
  padding: 4px 0px;
  cursor: pointer;
}

dialog label, dialog h2, dialog h3, dialog h4 {
  margin: 0;
  margin-bottom: 5px;
  padding: 0;
  color: #fff;
}   

dialog p {
  color: #ccc;
}

dialog a {
  color: #1e90ff;
  text-underline-offset: 5px;
  text-underline-thickness: 2px;
  text-decoration-style: dashed;
  transition: color 0.3s ease;

  &:hover {
    color: #fff;
  }
}
`;
