const SalesQueenStorage = (() => {
  const KEY = 'salesqueen_project_v1';

  function save(data) {
    try {
      const serialized = JSON.stringify(data);
      localStorage.setItem(KEY, serialized);
      return true;
    } catch (e) {
      console.error('Save failed', e);
      return false;
    }
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error('Load failed', e);
      return null;
    }
  }

  function clear() {
    localStorage.removeItem(KEY);
  }

  return { save, load, clear, KEY };
})();


