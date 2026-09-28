# #109 Parameterized circuit templates and binding

Scope: `ParametricCircuit` wrapper + `bind(Map<String, Double>)` che produce `Circuit` concreto. Validazione input obbligatoria. Nessuna mutazione di `Gate`; round-trip `CircuitSpec` preserva valori legati.

Copertura: Rx/Ry/Rz/Phase/U3 con parametri nominati; un parametro può apparire in più posizioni; ordinamento documentato.
