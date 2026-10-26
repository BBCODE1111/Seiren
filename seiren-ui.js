// Presentation only. Move the original nodes so IDs, listeners, validation,
// history, audio routing and project compatibility keep their existing owners.
export function mountSeirenUI(lab) {
  const $ = id => document.getElementById(id);
  const host = $('melodyWorkspace');
  const make = (tag, className, text) => {
    const node = document.createElement(tag);
    node.className = className;
    if (text) node.textContent = text;
    return node;
  };
  const top = make('div', 'seiren-topbar');
  const styles = make('div', 'seiren-stylebar');
  const editor = make('div', 'seiren-editor');
  const inspector = make('aside', 'seiren-inspector');
  inspector.setAttribute('aria-label', 'Accompaniment settings');
  const notices = make('div', 'seiren-notices');
  // Keep destination containers connected before moving ID-addressed controls.
  host.prepend(top, styles, notices, editor, inspector);
  const score = document.querySelector('.score');
  const transport = score.querySelector('.transport');
  const work = $('ml-work');
  const originalHeader = host.querySelector(':scope > .section-label');
  const headerActions = document.querySelector('.seiren-header-actions');
  headerActions.append($('saveProject'), $('loadProject').closest('label'), originalHeader.querySelector('button'));
  originalHeader.remove();
  $('saveProject').textContent = 'Save project';
  $('saveProject').title = 'Save notes, chords and settings as a project';
  top.append(host.querySelector('.melody-upload'), $('generate'), $('loosen'));
  $('generate').textContent = 'Generate harmony';
  $('dockMidi').textContent = 'Export MIDI';
  const compare = host.querySelector('.melody-compare');
  compare.querySelector('strong').remove();
  const styleLabel = $('style').closest('label');
  styles.append(compare, styleLabel);
  styleLabel.firstChild.textContent = 'ALL STYLES';
  const syncStyles = () => {
    for (const button of compare.querySelectorAll('button')) {
      button.setAttribute('aria-pressed', String(button.dataset.compareStyle === $('style').value));
    }
  };
  $('style').addEventListener('change', syncStyles);
  compare.addEventListener('click', () => queueMicrotask(syncStyles));
  syncStyles();
  for (const id of ['ml-status', 'ml-error', 'ml-progress-wrap']) notices.append($(id));
  // Keep the note tools and popovers inside the MelodyWorkspace host: its
  // controller intentionally scopes lookups to that host after every render.
  const tools = work.querySelector('.roll-tools');
  editor.append(tools, score, work);
  const scoreActions = score.querySelector('.score-actions');
  const chordActions = make('details', 'seiren-chord-actions');
  chordActions.append(make('summary', '', 'Chord actions'), scoreActions);
  tools.append(chordActions);
  const scoreHeading = score.querySelector('.sectionhead');
  scoreHeading.classList.add('seiren-score-heading');
  // Original score heading and cue information stay accessible to readers.
  score.querySelector('.score-hint').classList.add('seiren-score-hint');
  inspector.append(make('h2', '', 'ACCOMPANIMENT'));
  const performance = document.querySelector('.performance');
  inspector.append(performance.querySelector('.performance-controls'));
  const mix = work.querySelector('.mixer-disclosure');
  mix.open = true;
  mix.querySelector('summary').textContent = 'Mix & melody';
  inspector.append(mix);
  const harmonicTools = document.querySelector('.harmonic-tools');
  const chordDetails = make('details', 'seiren-chord-tools');
  chordDetails.append(make('summary', '', 'Shape selected chord'), harmonicTools);
  inspector.append(chordDetails);
  const legend = make('div', 'seiren-legend');
  legend.append(make('span', 'legend-melody', 'Melody'), make('span', 'legend-accompaniment', 'Accompaniment'));
  editor.append(legend);
  const empty = make('div', 'seiren-empty');
  empty.append(make('h2', '', 'Start with a melody'), make('p', '', 'Import audio or MIDI, draw your notes, or try the demo.'));
  const emptyActions = make('div', 'seiren-empty-actions');
  for (const [label, target] of [['Import melody', 'ml-file'], ['Draw notes', 'ml-new'], ['Try demo', 'ml-demo']]) {
    const button = make('button', '', label);
    button.type = 'button';
    button.addEventListener('click', () => $(target).click());
    emptyActions.append(button);
  }
  empty.append(emptyActions);
  editor.append(empty);
  host.prepend(top, styles, notices, editor, inspector);
  host.append(transport);
  transport.classList.add('seiren-transport');
  // Advanced features remain original controls, in explicitly labelled drawers.
  const more = make('section', 'seiren-more');
  for (const [selector, label] of [
    ['.quick-entry', 'Chord input & inspiration'],
    ['.settings', 'Harmony options'],
    ['.performance', 'Performance & arpeggiator']
  ]) {
    const section = document.querySelector(selector);
    const details = make('details', 'seiren-drawer panel');
    details.append(make('summary', '', label), section);
    more.append(details);
  }
  host.after(more);
  const syncEditorState = () => {
    const editing = !work.hidden;
    host.classList.toggle('has-melody-editor', editing);
    empty.hidden = editing;
    // Chord undo / keep / clear must also remain reachable in chord-only mode.
    tools.hidden = false;
    legend.hidden = !editing;
    mix.hidden = !editing;
  };
  new MutationObserver(syncEditorState).observe(work, { attributes: true, attributeFilter: ['hidden'] });
  syncEditorState();
  // Refit the SVG's viewport after reparenting and responsive layout changes.
  // Repainting is deferred while dragging so note pointer capture is preserved.
  let lastWidth = 0;
  const observer = new ResizeObserver(entries => {
    const width = Math.round(entries[0].contentRect.width);
    if (width && width !== lastWidth) {
      const firstLayout = !lastWidth;
      lastWidth = width;
      requestAnimationFrame(() => {
        const row = matchMedia('(pointer:coarse), (max-width:600px)').matches ? 24 : 18;
        if (firstLayout || row !== lab.roll.row) lab.roll.initialized = false;
        lab.roll.row = row;
        lab.draw(lab.roll.accompaniment);
      });
    }
  });
  observer.observe(lab.roll.scroll);
  lab.roll.initialized = false;
  lab.draw(lab.roll.accompaniment);
}
