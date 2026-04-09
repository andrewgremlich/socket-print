export const formContainerStyle = `
dialog {
  z-index: var(--z-dropdown);
  border: none;
  border-radius: var(--radius-lg);
  background-color: var(--bg-menu);
  box-shadow: var(--shadow-dropdown);
  padding: var(--spacing-lg) var(--spacing-xl) !important;
}

dialog::backdrop {
  background: var(--shadow-overlay);
}

dialog form {
  display: grid;
  row-gap: var(--spacing-xs);
  column-gap: 50px;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

dialog form > * {
  grid-column-start: span 1;
}

dialog input {
  background-color: var(--bg-input);
  color: var(--text-primary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  padding: 8px 12px;
  cursor: pointer;
}

dialog input:disabled, dialog input[readonly] {
  background-color: var(--bg-disabled);
  color: var(--text-disabled);
  cursor: not-allowed;
}

dialog label, dialog h2, dialog h3, dialog h4 {
  margin: 0;
  color: var(--text-primary);
}

dialog p {
  color: var(--text-secondary);
}

dialog a {
  color: var(--text-link);
  text-underline-offset: var(--spacing-xs);
  text-underline-thickness: 2px;
  text-decoration-style: dashed;
  transition: color var(--transition-slow);

  &:hover {
    color: var(--accent-color);
  }
}

select {
  font-family: inherit;
  font-size: 0.9375rem;
  font-weight: 400;
  background-color: var(--bg-input);
  color: var(--text-primary);
  border: 1px solid var(--border-default);
  border-radius: 10px;
  padding: 8px 12px;
  padding-right: 32px;
  width: 150px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 16px;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background-color 0.2s ease;
}

select:hover:not(:focus) {
  border-color: var(--border-hover);
  background-color: var(--bg-input-hover);
}

select:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow:
    0 0 0 3px var(--accent-color-subtle),
    0 1px 2px rgba(0, 0, 0, 0.05);
  background-color: var(--bg-input);
}
`;
