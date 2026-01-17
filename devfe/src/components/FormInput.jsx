
export default function FormInput({ label, type = "text", name, value, onChange, error }) {
  return (
    //neka standardna struktura forme koje cemo prosledjivati - sa input poljima
    <div className="form-group">
      <label htmlFor={name}>{label}</label>
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        className={`form-control ${error ? "has-error" : ""}`}
      />
      {error && <div className="form-error">{error}</div>}
    </div>
  );
}
