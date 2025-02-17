export const formContainerStyle = `
:host {
	position: fixed;
	z-index: 9999;
	bottom: 10px;
	right: 10px;
	background-color: #444;
	border-radius: 15px;
	box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  padding: 20px 30px !important;

  .hide { display: none; }

	& > form {
		display: grid;
		row-gap: 5px;
		column-gap: 50px;
		grid-template-columns: 1fr 1fr;
		align-items: center;

		& > * {
			grid-column-start: span 1;
		}
	}


  & input {
    background-color: #f0f0f0;
    color: #000;
    border: 3px solid #ccc;
    border-radius: 8px;
    padding: 4px 0px;
    cursor: pointer;
  }

  & label, & h3 {
    margin: 0;
    margin-bottom: 5px;
    padding: 0;
    color: #fff;
  }
}`;
