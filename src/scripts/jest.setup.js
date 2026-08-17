// Stub Dota engine globals that some vscripts modules read at import time
// (e.g. class static field initializers), so requiring those modules in
// tests doesn't crash before an individual test file gets a chance to
// set up its own mock.
if (typeof global.IsInToolsMode === 'undefined') {
  global.IsInToolsMode = () => false;
}
