// The explorer page: builds a request to the demo API from checkboxes, sends it, and shows the response.
// The server lists the API's routes (Explorer::Catalog). Each route's options come from its own menu, which the page
// asks for with `?menu` when the route is picked, so the controls always match what the endpoint accepts.

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

// One field from the menu. Default fields start selected: de-selecting one excludes it, and selecting a field that isn't a
// default includes it. An expand's own fields shape the nested resources.
class FieldNode {
  constructor(field) {
    this.field = field;
    this.children = (field.fields || []).map((child) => new FieldNode(child));
  }

  // Only an expand carries a field menu of its own; its type alone can't tell it from an `_ids` list.
  get association() {
    return 'fields' in this.field;
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

// The input that suits the values a filter compares, by the Rails type the menu gives, and a value to start from.
// Surrender takes times in ISO 8601 only, so times start at the beginning of the year in UTC, said with a Z.
const filterInput = (type) => {
  const year = new Date().getUTCFullYear();
  switch (type) {
    case 'boolean':
      return { input: 'choice', choices: [true, false] };
    case 'date':
      return { input: 'date', initial: `${year}-01-01` };
    case 'datetime':
      return { input: 'datetime', initial: `${year}-01-01T00:00:00Z` };
    case 'integer':
      return { input: 'number', initial: 1 };
    default:
      // Strings, and filters the model defines, which compare no one column.
      return { input: 'text', initial: '' };
  }
};

// A filter row: a checkbox to apply it and an input for its value, prefilled so selecting it is enough.
class FilterRow {
  constructor(name, { type }) {
    this.name = name;
    Object.assign(this, filterInput(type));
  }

  // Surrender reads filters as YAML, which needs dates and times quoted, and free text quoted so commas and colons
  // in it stay part of the value.
  get quoted() {
    return ['date', 'datetime', 'text'].includes(this.input);
  }

  render() {
    const { input, label } = toggle({ text: this.name });
    this.box = input;
    const { element, input: value } = this.valueControl();
    this.value = value;
    this.value.setAttribute('aria-label', `${this.name} value`);
    // Editing the value is a clear sign the filter is wanted.
    this.value.addEventListener('input', () => {
      this.box.checked = true;
    });
    return el('li', { class: 'filter' }, input, label, element);
  }

  // The element to show, and the input that holds the value, which differ for a time and its calendar button.
  valueControl() {
    if (this.input === 'choice') {
      const select = el('select', {}, ...this.choices.map((choice) => el('option', { value: String(choice) }, String(choice))));
      return { element: select, input: select };
    }
    if (this.input === 'date' || this.input === 'datetime') return this.timestampControl();
    const type = this.input === 'number' ? 'number' : 'text';
    const input = el('input', { type, value: this.initial, placeholder: this.input === 'text' ? 'value' : '' });
    return { element: input, input };
  }

  // A date or time shows as surrender receives it, so the field and the URL agree. Beside it is the browser's own
  // date input, trimmed to its calendar icon. It holds digits with no zone, which are taken as UTC, and a time gets
  // its Z. The two stay in step, so the calendar opens on whatever the text holds.
  timestampControl() {
    const time = this.input === 'datetime';
    const pattern = time ? '\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}Z' : '\\d{4}-\\d{2}-\\d{2}';
    const text = el('input', { type: 'text', class: 'timestamp-text', value: this.initial, spellcheck: false, pattern });
    // A step of one second makes the picker offer seconds.
    const picker = el('input', { type: time ? 'datetime-local' : 'date', step: 1, class: 'timestamp-picker' });
    picker.setAttribute('aria-label', `Pick ${this.name} from a calendar`);
    const follow = () => {
      picker.value = text.value.replace(/Z$/, '');
    };
    follow();
    text.addEventListener('input', follow);
    picker.addEventListener('change', () => {
      if (!picker.value) return;
      // The picker leaves out seconds when they are zero, and surrender wants them.
      const seconds = picker.value.length === 16 ? ':00' : '';
      text.value = time ? `${picker.value}${seconds}Z` : picker.value;
      text.dispatchEvent(new Event('input', { bubbles: true }));
    });
    return { element: el('span', { class: 'timestamp' }, text, picker), input: text };
  }

  entry() {
    if (!this.box.checked) return null;
    return `${this.name}:${this.quoted ? quote(this.value.value) : this.value.value}`;
  }
}

// An endpoint menu has both parts, either of which may be null. Anything else came from a route that doesn't
// surrender, which answers `?menu` as it answers any request.
// The demo authenticates by user id in the Authorization header. No user sends the request without one.
const requestHeaders = (user) => (user ? { Accept: 'application/json', Authorization: user } : { Accept: 'application/json' });

const isMenu = (data) => data !== null && typeof data === 'object' && 'fields' in data && 'selection' in data;

// The options each override leaves without effect, by parameter kind. Surrender answers `menu` before reading any
// other option, `count` included. A `count` counts every record the filter matches, so it renders no fields and has
// no pages, and its order can't change the number. The request still sends them: the explorer only says they don't
// apply, since a request may carry them.
const IGNORED_BY = {
  menu: ['count', 'shape', 'filter', 'sort', 'paging'],
  count: ['shape', 'sort', 'paging']
};

// The controls for one endpoint, and the request they describe. They are built from the endpoint's menu, which loads
// when the endpoint is first picked.
class EndpointPanel {
  constructor(path) {
    this.template = path;
    this.menu = null;
    // True once the page knows what the route accepts, which is worth asking again only after a failure.
    this.loaded = false;
  }

  get member() {
    return this.template.includes('{id}');
  }

  render() {
    const sections = [];
    if (this.member) {
      this.id = el('input', { type: 'number', min: 1, value: 1, id: uniqueId('record') });
      sections.push(
        this.section('record', 'Record', null, el('label', { class: 'record-id', htmlFor: this.id.id }, 'Id', this.id))
      );
    }
    this.body = el('div', {}, el('p', { class: 'empty' }, 'Reading what this endpoint accepts…'));
    this.element = el('div', { class: 'panel', hidden: true }, ...sections, this.body);
    return this.element;
  }

  // Asks the route for its menu as the given user. Callbacks and authorization still run for a menu, so a route
  // may refuse it as it would refuse the records.
  async load(user) {
    try {
      const response = await fetch(`${this.path()}?menu`, { headers: requestHeaders(user) });
      const data = await response.json().catch(() => undefined);
      if (!response.ok) {
        this.explain(`This endpoint refused its menu with ${response.status} ${response.statusText}. Pick another user under Auth${this.member ? ', or another id' : ''}.`, 'failure');
      } else if (!isMenu(data)) {
        this.explain("This route doesn't surrender, so it takes no query options.");
      } else if (data.fields === null) {
        this.explain('This endpoint renders something with no model, so it accepts no query options.');
      } else {
        this.build(data);
      }
      this.loaded = response.ok;
    } catch (error) {
      this.explain(`The menu request didn't reach the server: ${error.message}. Is bin/rails server running?`, 'failure');
    }
  }

  explain(message, kind = 'empty') {
    this.menu = null;
    this.body.replaceChildren(el('p', { class: kind }, message));
  }

  build(menu) {
    this.menu = menu;
    this.fields = menu.fields.map((field) => new FieldNode(field));
    const sections = [
      this.overridesSection(menu.selection),
      this.section(
        'shape',
        'Fields',
        'De-select a default to exclude it. Select anything else to include it.',
        el('ul', { class: 'fields' }, ...this.fields.map((field) => field.render()))
      )
    ];

    const { selection } = menu;
    if (selection) {
      this.filters = Object.entries(selection.filters).map(([name, filter]) => new FilterRow(name, filter));
      sections.push(
        this.section(
          'filter',
          'Filter',
          'Every column can be matched. Timestamps also have before and after. Times are UTC.',
          el('ul', { class: 'filters' }, ...this.filters.map((filter) => filter.render()))
        ),
        this.section('sort', 'Sort', null, this.sortControls(selection.sorts)),
      );
      if (selection.page) {
        sections.push(this.section('paging', 'Pagination', 'Options left de-selected use the server default.', this.pagingControls(selection.page)));
      }
    }
    this.body.replaceChildren(...sections);
  }

  // An override answers with something other than the records. `count` needs a collection.
  overridesSection(selection) {
    const options = [
      { name: 'menu', hint: 'a menu of available options for crafting the response' },
      selection ? { name: 'count', hint: 'a count of records that match the chosen filters' } : null
    ].filter(Boolean);
    this.overrides = options.map(({ name, hint }) => {
      const { input, label } = toggle({ text: name });
      input.addEventListener('change', () => this.markIgnored());
      return { name, input, row: el('li', { 'data-kind': name }, input, label, el('span', { class: 'hint' }, hint)) };
    });
    return this.section(
      'override',
      'Overrides',
      'Each answers with something other than the records, so some other options stop applying.',
      el('ul', { class: 'filters' }, ...this.overrides.map(({ row }) => row))
    );
  }

  // The first selected override that ignores options of this kind, if any. `menu` comes first, as surrender reads it
  // first.
  ignoredBy(kind) {
    return this.overrides?.find(({ name, input }) => input.checked && IGNORED_BY[name].includes(kind))?.name;
  }

  // Ignored options stay editable and are still sent. They only look ignored, with a note saying which override
  // ignores them.
  markIgnored() {
    for (const warning of this.body.querySelectorAll('.warning')) warning.hidden = true;
    for (const item of this.body.querySelectorAll('[data-kind]')) {
      // An override is only worth a warning when it's selected; a section's selections always are.
      const deselected = item.matches('li') && !item.querySelector('input').checked;
      const by = deselected ? undefined : this.ignoredBy(item.dataset.kind);
      item.classList.toggle('ignored', Boolean(by));
      if (!by) continue;

      // Every warning sits under its section's title. One inside an override's row would push its checkbox aside.
      const warning = item.closest('.section').querySelector(':scope > .warning');
      warning.hidden = false;
      warning.replaceChildren(...this.subject(item), ' ignored when requesting ', el('code', {}, by), '.');
    }
  }

  // What a warning is about: a section's selections, or one override.
  subject(item) {
    return item.dataset.title ? [`${item.dataset.title} selections are`] : [el('code', {}, item.dataset.kind), ' is'];
  }

  section(kind, title, hint, ...body) {
    return el(
      'fieldset',
      { class: `section section-${kind}`, 'data-kind': kind, 'data-title': title },
      el('legend', {}, title),
      el('p', { class: 'warning', hidden: true }),
      hint ? el('p', { class: 'hint' }, hint) : null,
      ...body
    );
  }

  sortControls(sorts) {
    const group = uniqueId('sort');
    const none = toggle({ type: 'radio', name: group, checked: true, text: 'none', value: '' });
    const keys = sorts.map((key) => toggle({ type: 'radio', name: group, text: key, value: key }));
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

  pagingControls(page) {
    const number = (name, value, max) => {
      const { input, label } = toggle({ text: name });
      const limits = max ? { min: 1, max } : { min: 1 };
      const amount = el('input', { type: 'number', ...limits, value, 'aria-label': `${name} value` });
      amount.addEventListener('input', () => {
        input.checked = true;
      });
      return { input, amount, row: el('li', { class: 'filter' }, input, label, amount) };
    };
    this.page = number('page', 1);
    // Surrender caps per at the page size limit, so the input stops there too.
    this.per = number('per', page.default, page.max);
    return el('ul', { class: 'filters' }, this.page.row, this.per.row);
  }

  show(visible) {
    this.element.hidden = !visible;
  }

  path() {
    return this.template.replace('{id}', this.id ? this.id.value || '1' : '');
  }

  // The query as [name, value] pairs in the order they read best. A null value is a bare flag, like `count` or `menu`.
  query() {
    if (!this.menu) return [];

    const params = this.overrides.filter(({ input }) => input.checked).map(({ name }) => [name, null, name]);
    const { include, exclude } = FieldNode.entriesFor(this.fields);
    if (include.length) params.push(['include', include.join(','), 'shape']);
    if (exclude.length) params.push(['exclude', exclude.join(','), 'shape']);
    if (!this.menu.selection) return params;

    const filters = this.filters.map((filter) => filter.entry()).filter(Boolean);
    if (filters.length) params.push(['filter', filters.join(','), 'filter']);

    const sort = this.sortInputs.find((input) => input.checked).value;
    if (sort) params.push(['sort', `${this.descending.checked ? '-' : ''}${sort}`, 'sort']);

    if (this.page?.input.checked) params.push(['page', this.page.amount.value, 'paging']);
    if (this.per?.input.checked) params.push(['per', this.per.amount.value, 'paging']);
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
    this.panels = this.catalog.endpoints.map((path) => new EndpointPanel(path));
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

    // A menu the endpoint refused may load as another user, or for another record.
    this.user.addEventListener('change', () => this.loadMenu());
    this.controls.addEventListener('change', (event) => {
      if (event.target === this.active.id) this.loadMenu();
    });

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

  // None comes first, but the first user starts selected, so every endpoint's options load.
  renderUsers() {
    this.user.append(el('option', { value: '' }, 'None'));
    const byCompany = Map.groupBy(this.catalog.users, (user) => user.company);
    for (const [company, users] of byCompany) {
      this.user.append(
        el('optgroup', { label: company }, ...users.map((user) => el('option', { value: user.id }, `${user.id}  ${user.name}`)))
      );
    }
    this.user.value = this.catalog.users[0]?.id ?? '';
  }

  renderEndpoints() {
    const nav = document.getElementById('endpoints');
    this.tabs = this.panels.map((panel) => {
      const tab = el('button', { type: 'button', class: 'endpoint' }, panel.template);
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
    this.loadMenu();
  }

  async loadMenu() {
    const panel = this.active;
    if (panel.loaded) return;

    await panel.load(this.user.value);
    if (panel === this.active) this.preview();
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
        el(
          'span',
          { class: `param param-${kind}${this.active.ignoredBy(kind) ? ' param-ignored' : ''}` },
          value === null ? name : `${name}=${value}`
        )
      );
    });

    const path = this.readableUrl();
    this.cli.textContent = `bin/http ${this.user.value ? `userId=${this.user.value} ` : ''}${quote(path)}`;
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
        headers: requestHeaders(this.user.value)
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
