/** Research-only provenance. No external images, map tiles or network assets ship. */
export const LISBON_REFERENCE_NOTES={
 coverage:'Belém–Alcântara on the north bank of the Tagus, with the facing Almada bank and Cristo Rei. Baixa, Alfama and the castle are outside this district.',
 accuracy:'North-up geographic miniature. Landmark centres use approximate geographic coordinates projected uniformly at 0.044 scene units per metre. Coastlines, street detail and elevations are simplified, and architecture is enlarged for play. This is not a navigation or survey map. Ponte 25 de Abril is walkable only as a gameplay concession; ordinary pedestrians cannot cross the real bridge.',
 construction:'Original procedural meshes; no photographs, source geometry, downloaded map tiles or proprietary architectural textures are redistributed. Facade details, roofs, vegetation and boats use bounded shared materials and geometry. Reference images are visual references only.',
 sources:[
  {url:'https://www.lusoponte.pt/25-de-abril/projecto/tracado-e-construcao',use:'Bridge operator: 1013 m central span, 483 m side spans, 190 m towers, 70 m navigation clearance, road and rail decks; the miniature preserves structural proportions while enlarging the roadway.'},
  {url:'https://www.visitlisboa.com/en/places/torre-de-belem',use:'Official tourism: Manueline tower above projecting armed bastion; maritime decorative motifs and riverbank setting.'},
  {url:'https://mosteirojeronimos.torrebelem.gov.pt/mosteiro-dos-jeronimos',use:'Monument authority: Belém/Restelo setting and Manueline monastery. Church, cloister and long west wing are separate visible masses.'},
  {url:'https://www.visitlisboa.com/pt-pt/locais/mosteiro-dos-jeronimos',use:'Official architectural photographs and location at Praça do Império.'},
  {url:'https://www.fundacaoedp.pt/en/news/amanda-levete-designs-new-maat-building',use:'Owner/designer description: low topographic roof, shaded waterfront entrance, ceramic tile skin and public promenade.'},
  {url:'https://www.maat.pt/sites/default/files/2020-08/EN-booklet-digital-maat-mode-2020-01.pdf',use:'Owner campus reference: modern MAAT next to historic Central Tejo brick power station on Belém waterfront.'},
  {url:'https://www.visitlisboa.com/pt-pt/lisbon-stories/22-rota-estatuaria/pois',use:'Official tourism locates Cristo Rei on the Almada bank, with open arms facing Lisbon.'},
  {url:'https://hemerotecadigital.cm-lisboa.pt/Periodicos/OMonumento/IISerie/N21/N21_master/Monumento_N21_Out1956.pdf',use:'Lisbon municipal archive: Cristo Rei pedestal 82 m and statue 28 m; four-pier pedestal and statue proportions are preserved.'},
 ],
 review:['Day/night estuary overview','North-up bank/topology check','Bridge cable sag, hangers and lower rail truss','Belém tower/bastion ground contact','Jerónimos long facade and open cloister','MAAT grounded wave shell','Christ statue facing Lisbon','Road/lamp corners and all six arrivals','Night lighting without bloom or extra shadow lights'],
} as const;
