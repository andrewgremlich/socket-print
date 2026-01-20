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
`;
