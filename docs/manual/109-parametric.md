# #109 Parameterized circuit templates and binding

## ParametricCircuit

Wrapper immutabile attorno a una topologia di gate parametrici. `bind(Map<String, Double>)` produce un `Circuit` concreto con parametri nominati sostituiti.

## Ordine parametri

- `RX`, `RY`, `RZ`, `PHASE`: un parametro `theta`.
- `U3`: tre parametri in ordine `theta`, `phi`, `lambda`.

## Validazione

Binding rifiuta chiavi mancanti, chiavi extra, parametri non finiti, e arity sbagliata.
