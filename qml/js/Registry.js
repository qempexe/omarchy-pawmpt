.pragma library

// Where the bar button finds the service when the bar can't hand it over. A replacement bar
// passes its own plugin's shell to the widgets it hosts, and that shell may not know this
// plugin's service; this file is one shared instance, so the service registers here.
var service = null;
function set(s) { service = s; }
function clear(s) { if (service === s) service = null; }
function get() { return service; }
