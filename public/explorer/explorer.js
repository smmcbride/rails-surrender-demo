// The explorer page: builds a request to the demo API from checkboxes, sends it, and shows the response.
// The catalog of endpoints and options comes from the server (Explorer::Catalog), so the controls always match
// what each model makes available.

'use strict';

const el = (tag, attributes = {}, ...children) => {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attributes)) {
    if (key === 'class') node.className = value;
    else if (key in node) node[key] = value;
    else node.setAttribute(key, value);
  }
  node.append(...children.filter((child) => child !== null && child !== undefined));
  return node;
};

let nextId = 0;
const uniqueId = (prefix) => `${prefix}-${nextId++}`;

// A labelled checkbox or radio. The label text is the API name, because that is what ends up in the URL.
const toggle = ({ type = 'checkbox', name, checked = false, text, value = '' }) => {
  const input = el('input', { type, name: name || '', checked, value, id: uniqueId('option') });
  const label = el('label', { htmlFor: input.id }, el('code', {}, text));
  return { input, label };
};

// Surrender reads list parameters as YAML, so values with quotes in them take the other kind of quote.
const quote = (value) => (String(value).includes("'") ? `"${value}"` : `'${value}'`);

// One attribute or association in the field tree. Default fields start ticked: unticking one excludes it, and
// ticking a field that isn't a default includes it. An association's own fields shape the nested resources.
class FieldNode {
  constructor(field) {
    this.field = field;
    this.children = (field.children || []).map((child) => new FieldNode(child));
  }

  get association() {
    return 'children' in this.field;
  }

  render() {
    const { input, label } = toggle({ name: this.field.name, checked: this.field.default, text: this.field.name });
    this.box = input;
    this.item = el('li', { class: this.association ? 'field association' : 'field' }, input, label);
    if (this.field.default) this.item.append(el('span', { class: 'default-mark', title: 'Rendered by default' }, 'default'));

    if (this.children.length) {
      this.nested = el('ul', { class: 'fields nested' }, ...this.children.map((child) => child.render()));
      this.item.append(this.nested);
    }
    input.addEventListener('change', () => this.refresh());
    this.refresh();
    return this.item;
  }

  refresh() {
    const changed = this.box.checked !== this.field.default;
    this.item.dataset.change = changed ? (this.box.checked ? 'include' : 'exclude') : '';
    if (this.nested) this.nested.hidden = !this.box.checked;
  }

  // The include and exclude entries this field adds, such as `created_at` or `activities:[creator]`.
  entries() {
    const { name, default: byDefault } = this.field;
    const checked = this.box.checked;
    if (!checked) return { include: [], exclude: byDefault ? [name] : [] };

    const nested = FieldNode.entriesFor(this.children);
    const include = [];
    if (nested.include.length) include.push(`${name}:[${nested.include.join(',')}]`);
    else if (!byDefault) include.push(name);
    const exclude = nested.exclude.length ? [`${name}:[${nested.exclude.join(',')}]`] : [];
    return { include, exclude };
  }

  static entriesFor(nodes) {
    return nodes.reduce(
      (all, node) => {
        const { include, exclude } = node.entries();
        return { include: all.include.concat(include), exclude: all.exclude.concat(exclude) };
      },
      { include: [], exclude: [] }
    );
  }
}

// A filter row: a checkbox to apply it and an input for its value, prefilled so ticking is enough.
class FilterRow {
  constructor(filter) {
    this.filter = filter;
  }

  render() {
    const { input, label } = toggle({ text: this.filter.name });
    this.box = input;
    this.value = this.valueInput();
    this.value.setAttribute('aria-label', `${this.filter.name} value`);
    // Editing the value is a clear sign the filter is wanted.
    this.value.addEventListener('input', () => {
      this.box.checked = true;
    });
    return el('li', { class: 'filter' }, input, label, this.value);
  }

  valueInput() {
    const { input, choices, default: initial } = this.filter;
    if (input === 'choice') {
      return el('select', {}, ...choices.map((choice) => el('option', { value: String(choice) }, String(choice))));
    }
    if (input === 'datetime') {
      // The input can't hold a time zone, so it holds the UTC time without its Z. A step of one second shows seconds.
      return el('input', { type: 'datetime-local', step: 1, value: initial.replace(/Z$/, '') });
    }
    const type = { number: 'number', date: 'date' }[input] || 'text';
    return el('input', { type, value: initial ?? '', placeholder: input === 'text' ? 'value' : '' });
  }

  entry() {
    if (!this.box.checked) return null;
    const value = this.filter.input === 'datetime' ? `${this.value.value}Z` : this.value.value;
    return `${this.filter.name}:${this.filter.quoted ? quote(value) : value}`;
  }
}

// The controls for one endpoint, and the request they describe.
class EndpointPanel {
  constructor(endpoint) {
    this.endpoint = endpoint;
    this.fields = endpoint.fields.map((field) => new FieldNode(field));
    this.filters = endpoint.filters.map((filter) => new FilterRow(filter));
  }

  render() {
    const sections = [];
    const { member, collection } = this.endpoint;

    if (member) {
      this.id = el('input', { type: 'number', min: 1, value: 1, id: uniqueId('record') });
      sections.push(
        this.section('record', 'Record', null, el('label', { class: 'record-id', htmlFor: this.id.id }, 'Id', this.id))
      );
    }

    sections.push(
      this.section(
        'shape',
        'Fields',
        'Untick a default to exclude it. Tick anything else to include it.',
        el('ul', { class: 'fields' }, ...this.fields.map((field) => field.render()))
      )
    );

    if (collection) {
      sections.push(
        this.section(
          'filter',
          'Filter',
          'Every column can be matched. Timestamps also have before and after. Times are UTC.',
          el('ul', { class: 'filters' }, ...this.filters.map((filter) => filter.render()))
        ),
        this.section('sort', 'Sort', null, this.sortControls()),
        this.section('paging', 'Pages and totals', 'Unticked options use the server default.', this.pagingControls())
      );
    }

    this.element = el('div', { class: 'panel', hidden: true }, ...sections);
    return this.element;
  }

  section(kind, title, hint, ...body) {
    return el(
      'fieldset',
      { class: `section section-${kind}` },
      el('legend', {}, title),
      hint ? el('p', { class: 'hint' }, hint) : null,
      ...body
    );
  }

  sortControls() {
    const group = uniqueId('sort');
    const none = toggle({ type: 'radio', name: group, checked: true, text: 'none', value: '' });
    const keys = this.endpoint.sorts.map((key) => toggle({ type: 'radio', name: group, text: key, value: key }));
    this.sortInputs = [none, ...keys].map(({ input }) => input);

    const descending = toggle({ text: 'descending' });
    this.descending = descending.input;

    return el(
      'div',
      {},
      el('ul', { class: 'sorts' }, ...[none, ...keys].map(({ input, label }) => el('li', {}, input, label))),
      el('p', { class: 'direction' }, descending.input, descending.label)
    );
  }

  pagingControls() {
    const { page, per } = this.endpoint.pagination;
    const number = (name, value) => {
      const { input, label } = toggle({ text: name });
      const amount = el('input', { type: 'number', min: 1, value, 'aria-label': `${name} value` });
      amount.addEventListener('input', () => {
        input.checked = true;
      });
      return { input, amount, row: el('li', { class: 'filter' }, input, label, amount) };
    };
    this.page = number('page', page);
    this.per = number('per', per);

    const count = toggle({ text: 'count' });
    this.count = count.input;

    return el(
      'ul',
      { class: 'filters' },
      this.page.row,
      this.per.row,
      el('li', { class: 'filter' }, count.input, count.label, el('span', { class: 'hint' }, 'how many match'))
    );
  }

  show(visible) {
    this.element.hidden = !visible;
  }

  path() {
    return this.endpoint.path.replace('{id}', this.id ? this.id.value || '1' : '');
  }

  // The query as [name, value] pairs in the order they read best. A null value is a bare flag, like `count`.
  query() {
    const params = [];
    const { include, exclude } = FieldNode.entriesFor(this.fields);
    if (include.length) params.push(['include', include.join(','), 'shape']);
    if (exclude.length) params.push(['exclude', exclude.join(','), 'shape']);
    if (!this.endpoint.collection) return params;

    const filters = this.filters.map((filter) => filter.entry()).filter(Boolean);
    if (filters.length) params.push(['filter', filters.join(','), 'filter']);

    const sort = this.sortInputs.find((input) => input.checked).value;
    if (sort) params.push(['sort', `${this.descending.checked ? '-' : ''}${sort}`, 'sort']);

    if (this.page.input.checked) params.push(['page', this.page.amount.value, 'paging']);
    if (this.per.input.checked) params.push(['per', this.per.amount.value, 'paging']);
    if (this.count.checked) params.push(['count', null, 'paging']);
    return params;
  }
}

// Renders JSON as highlighted HTML. Every value is escaped, because the seed data is arbitrary text.
const escapeHtml = (text) =>
  String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const jsonHtml = (value, depth = 0) => {
  const pad = '  '.repeat(depth);
  const inner = '  '.repeat(depth + 1);
  if (value === null) return '<span class="j-null">null</span>';
  if (Array.isArray(value)) {
    if (!value.length) return '[]';
    return `[\n${value.map((item) => inner + jsonHtml(item, depth + 1)).join(',\n')}\n${pad}]`;
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value);
    if (!entries.length) return '{}';
    const lines = entries.map(
      ([key, item]) => `${inner}<span class="j-key">"${escapeHtml(key)}"</span>: ${jsonHtml(item, depth + 1)}`
    );
    return `{\n${lines.join(',\n')}\n${pad}}`;
  }
  if (typeof value === 'string') return `<span class="j-string">"${escapeHtml(value)}"</span>`;
  return `<span class="j-${typeof value}">${escapeHtml(value)}</span>`;
};

class Explorer {
  constructor(root) {
    this.catalog = JSON.parse(root.dataset.catalog);
    this.panels = this.catalog.endpoints.map((endpoint) => new EndpointPanel(endpoint));
    this.user = document.getElementById('user');
    this.url = document.getElementById('url');
    this.cli = document.getElementById('cli');
    this.response = document.getElementById('response');
    this.controls = document.getElementById('controls');
    this.sendButton = document.getElementById('send');
  }

  start() {
    this.renderUsers();
    this.renderEndpoints();
    this.controls.append(...this.panels.map((panel) => panel.render()));
    this.select(this.panels[0]);

    // Every control is inside the form or the header, so one listener keeps the URL current.
    document.addEventListener('input', () => this.preview());
    document.addEventListener('change', () => this.preview());
    this.controls.addEventListener('submit', (event) => event.preventDefault());
    this.sendButton.addEventListener('click', () => this.send());
    document.getElementById('copy').addEventListener('click', (event) => this.copy(event.currentTarget));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) this.send();
    });
  }

  renderUsers() {
    const byCompany = Map.groupBy(this.catalog.users, (user) => user.company);
    for (const [company, users] of byCompany) {
      this.user.append(
        el('optgroup', { label: company }, ...users.map((user) => el('option', { value: user.id }, `${user.id}  ${user.name}`)))
      );
    }
  }

  renderEndpoints() {
    const nav = document.getElementById('endpoints');
    this.tabs = this.panels.map((panel) => {
      const tab = el('button', { type: 'button', class: 'endpoint' }, panel.endpoint.path);
      tab.addEventListener('click', () => this.select(panel));
      nav.append(tab);
      return tab;
    });
  }

  select(panel) {
    this.active = panel;
    this.panels.forEach((other, index) => {
      other.show(other === panel);
      this.tabs[index].setAttribute('aria-current', other === panel ? 'page' : 'false');
    });
    this.preview();
  }

  // The request as people read it: brackets, colons and quotes left as typed.
  readableUrl() {
    const query = this.active.query().map(([name, value]) => (value === null ? name : `${name}=${value}`));
    return this.active.path() + (query.length ? `?${query.join('&')}` : '');
  }

  fetchUrl() {
    const query = this.active
      .query()
      .map(([name, value]) => (value === null ? name : `${name}=${encodeURIComponent(value)}`));
    return this.active.path() + (query.length ? `?${query.join('&')}` : '');
  }

  preview() {
    const params = this.active.query();
    this.url.replaceChildren(el('span', { class: 'path' }, this.active.path()));
    params.forEach(([name, value, kind], index) => {
      this.url.append(
        el('span', { class: 'joint' }, index === 0 ? '?' : '&'),
        el('span', { class: `param param-${kind}` }, value === null ? name : `${name}=${value}`)
      );
    });

    const path = this.readableUrl();
    this.cli.textContent = `bin/http userId=${this.user.value} ${quote(path)}`;
  }

  async copy(button) {
    await navigator.clipboard.writeText(this.cli.textContent);
    button.textContent = 'Copied';
    setTimeout(() => {
      button.textContent = 'Copy';
    }, 1500);
  }

  async send() {
    this.sendButton.disabled = true;
    this.response.setAttribute('aria-busy', 'true');
    const started = performance.now();
    try {
      const response = await fetch(this.fetchUrl(), {
        headers: { Accept: 'application/json', Authorization: this.user.value }
      });
      const body = await response.text();
      this.showResponse(response, body, Math.round(performance.now() - started));
    } catch (error) {
      this.response.replaceChildren(
        el('p', { class: 'failure' }, `The request didn't reach the server: ${error.message}. Is bin/rails server running?`)
      );
    } finally {
      this.sendButton.disabled = false;
      this.response.removeAttribute('aria-busy');
    }
  }

  showResponse(response, body, milliseconds) {
    const facts = [
      el('span', { class: `status ${response.ok ? 'ok' : 'error'}` }, `${response.status} ${response.statusText}`),
      el('span', { class: 'fact' }, `${milliseconds} ms`)
    ];

    let data;
    try {
      data = JSON.parse(body);
    } catch {
      data = undefined;
    }
    if (Array.isArray(data)) facts.push(el('span', { class: 'fact' }, `${data.length} ${data.length === 1 ? 'record' : 'records'}`));

    const sort = response.headers.get('X-Sort');
    if (sort) facts.push(el('span', { class: 'fact' }, 'X-Sort ', el('code', {}, sort)));

    const pagination = response.headers.get('X-Pagination');
    const headers = pagination ? this.paginationTable(JSON.parse(pagination)) : null;

    const pre = el('pre', { class: 'body' });
    if (data === undefined) pre.textContent = body;
    else pre.innerHTML = jsonHtml(data);

    this.response.replaceChildren(...[el('div', { class: 'facts' }, ...facts), headers, pre].filter(Boolean));
  }

  paginationTable(pagination) {
    const cells = Object.entries(pagination).map(([key, value]) =>
      el('div', {}, el('dt', {}, key), el('dd', {}, value === null ? 'null' : String(value)))
    );
    return el('details', { class: 'pagination' }, el('summary', {}, 'X-Pagination: page ', String(pagination.page), ' of ', String(pagination.last_page), ', ', String(pagination.total), ' in total'), el('dl', {}, ...cells));
  }
}

new Explorer(document.getElementById('explorer')).start();
