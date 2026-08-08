export default function AdminLoading() {
  return (
    <main className="admin-auth-page" aria-busy="true" aria-live="polite">
      <section className="admin-auth-card">
        <p className="eyebrow">FoodForFun Atlas Admin</p>
        <h1>Checking your session</h1>
        <p className="admin-auth-introduction">
          Verifying authentication and editorial access…
        </p>
      </section>
    </main>
  );
}
