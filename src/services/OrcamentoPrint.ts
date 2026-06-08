// ════════════════════════════════════════════════════════════════════
// Gerador de orçamento Vulcano — reproduz o template orcamento-vulcano-print.html
// Abre uma janela de impressão idêntica ao padrão e dispara o print do navegador
// (use "Salvar como PDF" no diálogo de impressão).
// ════════════════════════════════════════════════════════════════════
import type { Orcamento, Cliente, Local, OrcamentoItem } from "@/types";

// Formata data ISO (YYYY-MM-DD) para pt-BR sem depender de libs externas
function formatDate(v?: string | null): string {
  if (!v) return "—";
  const d = new Date(v.length <= 10 ? v + "T12:00:00" : v);
  if (isNaN(d.getTime())) return String(v);
  return d.toLocaleDateString("pt-BR");
}

const EMPRESA = {
  nome: "Vulcano Metalúrgica Arquitetônica",
  cnpj: "55.762.141/0001-33",
  email: "vulcanometalurgicagcr@hotmail.com",
  celular: "(48) 99648-7447",
};

const ICONES: Record<string, string> = {
  gate: "🚧", grade: "⬛", stairs: "🪜", cover: "🔲",
  rail: "➿", struct: "🏗️", window: "🪟", other: "🔩",
};

// ── Logo oficial Vulcano (mesmo SVG do template) ──
const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="310" height="102" viewBox="195 548 1235 406" preserveAspectRatio="xMinYMid meet"><defs><clipPath id="vca9"><path d="M 249 1.171875 L 430.453125 1.171875 L 430.453125 384 L 249 384 Z M 249 1.171875 " clip-rule="nonzero"/></clipPath><clipPath id="vcf6"><path d="M 0.34375 1.171875 L 267 1.171875 L 267 394.828125 L 0.34375 394.828125 Z M 0.34375 1.171875 " clip-rule="nonzero"/></clipPath><clipPath id="vc79"><path d="M 258 1.171875 L 439.199219 1.171875 L 439.199219 384 L 258 384 Z M 258 1.171875 " clip-rule="nonzero"/></clipPath><clipPath id="vc67"><path d="M 9.089844 1.171875 L 276 1.171875 L 276 394.828125 L 9.089844 394.828125 Z M 9.089844 1.171875 " clip-rule="nonzero"/></clipPath><clipPath id="vc4d"><rect x="0" width="441" y="0" height="396"/></clipPath></defs><path stroke-linecap="round" transform="matrix(0.75, 0, 0, 0.75, 704.697813, 798.771703)" fill="none" stroke-linejoin="miter" d="M 2.001875 2.002313 L 194.673767 2.002313 " stroke="#f77f00" stroke-width="4" stroke-opacity="1" stroke-miterlimit="4"/><g fill="#0d0d0d"><g transform="translate(711.178281, 759.023699)"><path d="M 18.0625 0 L 3.078125 -96.671875 L 17.078125 -96.671875 L 23.390625 -53 L 27.296875 -22.25 L 27.6875 -22.25 L 31.03125 -53 L 36.3125 -96.671875 L 50.03125 -96.671875 L 36.25 0 Z M 18.0625 0 "/></g><g transform="translate(764.231186, 759.023699)"><path d="M 49.328125 -24.828125 C 49.328125 -15.929688 47.640625 -9.382812 44.265625 -5.1875 C 40.898438 -1 35.488281 1.09375 28.03125 1.09375 C 20.582031 1.09375 15.164062 -1.007812 11.78125 -5.21875 C 8.394531 -9.425781 6.703125 -15.960938 6.703125 -24.828125 L 6.703125 -96.71875 L 21.421875 -96.71875 L 21.421875 -25.09375 C 21.421875 -20.007812 21.65625 -16.914062 22.125 -15.8125 C 22.601562 -14.71875 23.179688 -13.722656 23.859375 -12.828125 C 24.535156 -11.929688 25.9375 -11.484375 28.0625 -11.484375 C 30.1875 -11.484375 31.707031 -12.101562 32.625 -13.34375 C 33.539062 -14.59375 34.097656 -16.140625 34.296875 -17.984375 C 34.503906 -19.835938 34.609375 -22.207031 34.609375 -25.09375 L 34.609375 -96.71875 L 49.328125 -96.71875 Z M 49.328125 -24.828125 "/></g><g transform="translate(820.249781, 759.023699)"><path d="M 7.25 0 L 7.25 -96.671875 L 21.96875 -96.671875 L 21.96875 -12.515625 L 40.59375 -12.515625 L 40.59375 0 Z M 7.25 0 "/></g><g transform="translate(862.044048, 759.023699)"><path d="M 48.0625 -26.359375 C 48.0625 -17.023438 46.394531 -10.113281 43.0625 -5.625 C 39.726562 -1.144531 34.488281 1.09375 27.34375 1.09375 C 20.207031 1.09375 14.875 -1.289062 11.34375 -6.0625 C 7.8125 -10.84375 6.046875 -17.71875 6.046875 -26.6875 L 6.046875 -68.8125 C 6.046875 -83.207031 9.816406 -92.195312 17.359375 -95.78125 C 20.140625 -97.101562 23.507812 -97.765625 27.46875 -97.765625 C 41.050781 -97.765625 47.84375 -89.195312 47.84375 -72.0625 L 47.84375 -58.765625 L 33.609375 -58.765625 L 33.609375 -71.125 C 33.609375 -76.101562 33.1875 -79.660156 32.34375 -81.796875 C 31.507812 -83.941406 29.863281 -85.015625 27.40625 -85.015625 C 24.957031 -85.015625 23.253906 -83.878906 22.296875 -81.609375 C 21.347656 -79.347656 20.875 -75.875 20.875 -71.1875 L 20.875 -26.03125 C 20.875 -20.832031 21.332031 -17.113281 22.25 -14.875 C 23.164062 -12.644531 24.832031 -11.53125 27.25 -11.53125 C 29.664062 -11.53125 31.328125 -12.664062 32.234375 -14.9375 C 33.148438 -17.207031 33.609375 -20.960938 33.609375 -26.203125 L 33.609375 -40.046875 L 48.0625 -40.046875 Z M 48.0625 -26.359375 "/></g><g transform="translate(914.822352, 759.023699)"><path d="M 33.171875 -29.0625 L 26.6875 -77.609375 L 26.46875 -77.609375 L 20.546875 -29.0625 Z M 2.859375 0 L 16.640625 -96.671875 L 36.078125 -96.671875 L 50.75 0 L 37.015625 0 L 34.71875 -17.25 L 19.109375 -17.25 L 17.03125 0 Z M 2.859375 0 "/></g><g transform="translate(968.424458, 759.023699)"><path d="M 7.25 0 L 7.25 -96.671875 L 18.78125 -96.671875 L 39.265625 -38.671875 L 38.234375 -65.03125 L 38.234375 -96.671875 L 51.46875 -96.671875 L 51.46875 0 L 41.03125 0 L 20 -60.03125 L 20.8125 -34.65625 L 20.8125 0 Z M 7.25 0 "/></g><g transform="translate(1027.134155, 759.023699)"><path d="M 20.875 -26.859375 C 20.875 -21.179688 21.300781 -17.222656 22.15625 -14.984375 C 23.019531 -12.753906 24.785156 -11.640625 27.453125 -11.640625 C 30.128906 -11.640625 31.890625 -12.785156 32.734375 -15.078125 C 33.578125 -17.367188 34 -21.296875 34 -26.859375 L 34 -71.890625 C 34 -76.472656 33.566406 -79.816406 32.703125 -81.921875 C 31.847656 -84.023438 30.164062 -85.078125 27.65625 -85.078125 C 25.144531 -85.078125 23.382812 -84.023438 22.375 -81.921875 C 21.375 -79.816406 20.875 -76.492188 20.875 -71.953125 Z M 48.765625 -27.015625 C 48.765625 -17.578125 47.082031 -10.53125 43.71875 -5.875 C 40.351562 -1.226562 34.960938 1.09375 27.546875 1.09375 C 20.128906 1.09375 14.691406 -1.238281 11.234375 -5.90625 C 7.773438 -10.570312 6.046875 -17.609375 6.046875 -27.015625 L 6.046875 -71.234375 C 6.046875 -88.953125 13.273438 -97.8125 27.734375 -97.8125 C 35.203125 -97.8125 40.570312 -95.5625 43.84375 -91.0625 C 47.125 -86.5625 48.765625 -79.953125 48.765625 -71.234375 Z M 48.765625 -27.015625 "/></g></g><g fill="#f77f00"><g transform="translate(705.107969, 859.444586)"><path d="M 35.171875 -29.421875 L 35.171875 0 L 31.5 0 L 31.5 -26.671875 L 21.59375 0 L 16.625 0 L 6.671875 -26.671875 L 6.671875 0 L 3.015625 0 L 3.015625 -29.421875 L 9.421875 -29.421875 L 19.15625 -3.3125 L 28.84375 -29.421875 Z M 35.171875 -29.421875 "/></g><g transform="translate(743.275511, 859.444586)"><path d="M 6.671875 -2.96875 L 24.90625 -2.96875 L 24.90625 0 L 3.015625 0 L 3.015625 -29.421875 L 24.765625 -29.421875 L 24.765625 -26.453125 L 6.671875 -26.453125 L 6.671875 -16.59375 L 23.4375 -16.59375 L 23.4375 -13.671875 L 6.671875 -13.671875 Z M 6.671875 -2.96875 "/></g><g transform="translate(770.961352, 859.444586)"><path d="M 26.234375 -29.421875 L 26.234375 -26.453125 L 15.703125 -26.453125 L 15.703125 0.046875 L 12.078125 0.046875 L 12.078125 -26.453125 L 1.453125 -26.453125 L 1.453125 -29.421875 Z M 26.234375 -29.421875 "/></g><g transform="translate(798.691414, 859.444586)"><path d="M 25.65625 0 L 22.78125 -7.515625 L 8.1875 -7.515625 L 5.3125 0 L 1.640625 0 L 12.78125 -29.421875 L 18.21875 -29.421875 L 29.375 0 Z M 9.296875 -10.484375 L 21.671875 -10.484375 L 15.484375 -26.765625 Z M 9.296875 -10.484375 "/></g><g transform="translate(829.605794, 859.444586)"><path d="M 6.671875 -2.96875 L 22.078125 -2.96875 L 22.078125 0 L 3.015625 0 L 3.015625 -29.421875 L 6.671875 -29.421875 Z M 6.671875 -2.96875 "/></g><g transform="translate(852.647842, 859.444586)"><path d="M 2.96875 -10.53125 L 2.96875 -29.421875 L 6.59375 -29.421875 L 6.59375 -10.96875 C 6.59375 -8.726562 6.898438 -6.976562 7.515625 -5.71875 C 8.140625 -4.46875 9.070312 -3.59375 10.3125 -3.09375 C 11.550781 -2.59375 13.082031 -2.34375 14.90625 -2.34375 C 16.738281 -2.34375 18.265625 -2.59375 19.484375 -3.09375 C 20.710938 -3.59375 21.632812 -4.46875 22.25 -5.71875 C 22.863281 -6.976562 23.171875 -8.726562 23.171875 -10.96875 L 23.171875 -29.421875 L 26.84375 -29.421875 L 26.84375 -10.53125 C 26.84375 -6.957031 25.878906 -4.191406 23.953125 -2.234375 C 22.023438 -0.273438 19.007812 0.703125 14.90625 0.703125 C 10.8125 0.703125 7.796875 -0.265625 5.859375 -2.203125 C 3.929688 -4.148438 2.96875 -6.925781 2.96875 -10.53125 Z M 2.96875 -10.53125 "/></g><g transform="translate(882.412331, 859.444586)"><path d="M 24.8125 -7.78125 L 24.8125 -4.6875 C 24.8125 -3.59375 24.878906 -2.675781 25.015625 -1.9375 C 25.148438 -1.207031 25.273438 -0.5625 25.390625 0 L 21.8125 0 C 21.664062 -0.5 21.539062 -1.117188 21.4375 -1.859375 C 21.332031 -2.597656 21.28125 -3.5 21.28125 -4.5625 L 21.28125 -7.25 C 21.28125 -9.34375 20.734375 -10.851562 19.640625 -11.78125 C 18.546875 -12.71875 16.984375 -13.1875 14.953125 -13.1875 L 6.671875 -13.1875 L 6.671875 0 L 3.015625 0 L 3.015625 -29.421875 L 16.71875 -29.421875 C 19.757812 -29.421875 22.023438 -28.71875 23.515625 -27.3125 C 25.003906 -25.914062 25.75 -24.035156 25.75 -21.671875 C 25.75 -19.703125 25.207031 -18.066406 24.125 -16.765625 C 23.050781 -15.460938 21.6875 -14.625 20.03125 -14.25 C 20.976562 -13.976562 21.804688 -13.613281 22.515625 -13.15625 C 23.222656 -12.695312 23.78125 -12.046875 24.1875 -11.203125 C 24.601562 -10.367188 24.8125 -9.226562 24.8125 -7.78125 Z M 16.28125 -15.921875 C 18.34375 -15.921875 19.789062 -16.40625 20.625 -17.375 C 21.46875 -18.351562 21.890625 -19.679688 21.890625 -21.359375 C 21.890625 -23.078125 21.441406 -24.351562 20.546875 -25.1875 C 19.648438 -26.03125 18.242188 -26.453125 16.328125 -26.453125 L 6.671875 -26.453125 L 6.671875 -15.921875 Z M 16.28125 -15.921875 "/></g><g transform="translate(911.026942, 859.444586)"><path d="M 16.671875 0.75 C 13.429688 0.75 10.753906 0.0820312 8.640625 -1.25 C 6.535156 -2.59375 4.972656 -4.429688 3.953125 -6.765625 C 2.941406 -9.097656 2.4375 -11.753906 2.4375 -14.734375 C 2.4375 -17.710938 2.972656 -20.363281 4.046875 -22.6875 C 5.117188 -25.019531 6.753906 -26.859375 8.953125 -28.203125 C 11.148438 -29.546875 13.945312 -30.21875 17.34375 -30.21875 C 21.738281 -30.21875 25.070312 -29.25 27.34375 -27.3125 C 29.613281 -25.382812 30.953125 -22.578125 31.359375 -18.890625 L 27.5625 -18.890625 C 27.175781 -21.722656 26.164062 -23.804688 24.53125 -25.140625 C 22.894531 -26.484375 20.453125 -27.15625 17.203125 -27.15625 C 13.460938 -27.15625 10.707031 -26.125 8.9375 -24.0625 C 7.164062 -22 6.28125 -18.890625 6.28125 -14.734375 C 6.28125 -10.628906 7.148438 -7.53125 8.890625 -5.4375 C 10.628906 -3.34375 13.398438 -2.296875 17.203125 -2.296875 C 19.503906 -2.296875 21.378906 -2.703125 22.828125 -3.515625 C 24.273438 -4.328125 25.390625 -5.445312 26.171875 -6.875 C 26.953125 -8.3125 27.472656 -9.941406 27.734375 -11.765625 L 14.46875 -11.765625 L 14.46875 -14.515625 L 31.3125 -14.515625 L 31.3125 -0.046875 L 28 -0.046875 L 28 -7.203125 C 27.582031 -5.765625 26.910156 -4.445312 25.984375 -3.25 C 25.054688 -2.050781 23.832031 -1.082031 22.3125 -0.34375 C 20.789062 0.382812 18.910156 0.75 16.671875 0.75 Z M 16.671875 0.75 "/></g><g transform="translate(945.567908, 859.444586)"><path d="M 19.0625 -26.453125 L 12.828125 -26.453125 L 12.828125 -2.96875 L 19.0625 -2.96875 L 19.0625 0 L 2.96875 0 L 2.96875 -2.96875 L 9.203125 -2.96875 L 9.203125 -26.453125 L 2.96875 -26.453125 L 2.96875 -29.421875 L 19.0625 -29.421875 Z M 19.0625 -26.453125 "/></g><g transform="translate(967.592748, 859.444586)"><path d="M 17.125 0.75 C 13.757812 0.75 10.992188 0.0820312 8.828125 -1.25 C 6.660156 -2.59375 5.050781 -4.429688 4 -6.765625 C 2.957031 -9.097656 2.4375 -11.753906 2.4375 -14.734375 C 2.4375 -17.679688 2.96875 -20.316406 4.03125 -22.640625 C 5.09375 -24.972656 6.710938 -26.816406 8.890625 -28.171875 C 11.078125 -29.535156 13.847656 -30.21875 17.203125 -30.21875 C 21.742188 -30.21875 25.101562 -29.171875 27.28125 -27.078125 C 29.46875 -24.984375 30.738281 -22.109375 31.09375 -18.453125 L 27.375 -18.453125 C 27.082031 -21.335938 26.09375 -23.507812 24.40625 -24.96875 C 22.726562 -26.425781 20.300781 -27.15625 17.125 -27.15625 C 13.46875 -27.15625 10.742188 -26.113281 8.953125 -24.03125 C 7.171875 -21.957031 6.28125 -18.859375 6.28125 -14.734375 C 6.28125 -10.628906 7.15625 -7.53125 8.90625 -5.4375 C 10.664062 -3.34375 13.375 -2.296875 17.03125 -2.296875 C 20.363281 -2.296875 22.882812 -3.117188 24.59375 -4.765625 C 26.300781 -6.421875 27.257812 -8.738281 27.46875 -11.71875 L 31.234375 -11.71875 C 31.085938 -9.238281 30.492188 -7.0625 29.453125 -5.1875 C 28.421875 -3.320312 26.894531 -1.863281 24.875 -0.8125 C 22.863281 0.226562 20.28125 0.75 17.125 0.75 Z M 17.125 0.75 "/></g><g transform="translate(1001.028032, 859.444586)"><path d="M 25.65625 0 L 22.78125 -7.515625 L 8.1875 -7.515625 L 5.3125 0 L 1.640625 0 L 12.78125 -29.421875 L 18.21875 -29.421875 L 29.375 0 Z M 9.296875 -10.484375 L 21.671875 -10.484375 L 15.484375 -26.765625 Z M 9.296875 -10.484375 "/></g><g transform="translate(1041.893392, 859.444586)"><path d="M 25.65625 0 L 22.78125 -7.515625 L 8.1875 -7.515625 L 5.3125 0 L 1.640625 0 L 12.78125 -29.421875 L 18.21875 -29.421875 L 29.375 0 Z M 9.296875 -10.484375 L 21.671875 -10.484375 L 15.484375 -26.765625 Z M 9.296875 -10.484375 "/></g><g transform="translate(1072.807772, 859.444586)"><path d="M 24.8125 -7.78125 L 24.8125 -4.6875 C 24.8125 -3.59375 24.878906 -2.675781 25.015625 -1.9375 C 25.148438 -1.207031 25.273438 -0.5625 25.390625 0 L 21.8125 0 C 21.664062 -0.5 21.539062 -1.117188 21.4375 -1.859375 C 21.332031 -2.597656 21.28125 -3.5 21.28125 -4.5625 L 21.28125 -7.25 C 21.28125 -9.34375 20.734375 -10.851562 19.640625 -11.78125 C 18.546875 -12.71875 16.984375 -13.1875 14.953125 -13.1875 L 6.671875 -13.1875 L 6.671875 0 L 3.015625 0 L 3.015625 -29.421875 L 16.71875 -29.421875 C 19.757812 -29.421875 22.023438 -28.71875 23.515625 -27.3125 C 25.003906 -25.914062 25.75 -24.035156 25.75 -21.671875 C 25.75 -19.703125 25.207031 -18.066406 24.125 -16.765625 C 23.050781 -15.460938 21.6875 -14.625 20.03125 -14.25 C 20.976562 -13.976562 21.804688 -13.613281 22.515625 -13.15625 C 23.222656 -12.695312 23.78125 -12.046875 24.1875 -11.203125 C 24.601562 -10.367188 24.8125 -9.226562 24.8125 -7.78125 Z M 16.28125 -15.921875 C 18.34375 -15.921875 19.789062 -16.40625 20.625 -17.375 C 21.46875 -18.351562 21.890625 -19.679688 21.890625 -21.359375 C 21.890625 -23.078125 21.441406 -24.351562 20.546875 -25.1875 C 19.648438 -26.03125 18.242188 -26.453125 16.328125 -26.453125 L 6.671875 -26.453125 L 6.671875 -15.921875 Z M 16.28125 -15.921875 "/></g><g transform="translate(1101.422371, 859.444586)"><path d="M 2.4375 -15.171875 C 2.4375 -18.085938 2.953125 -20.679688 3.984375 -22.953125 C 5.015625 -25.222656 6.628906 -27 8.828125 -28.28125 C 11.023438 -29.570312 13.832031 -30.21875 17.25 -30.21875 C 20.664062 -30.21875 23.460938 -29.570312 25.640625 -28.28125 C 27.828125 -27 29.4375 -25.242188 30.46875 -23.015625 C 31.507812 -20.796875 32.03125 -18.285156 32.03125 -15.484375 C 32.03125 -12.535156 31.382812 -9.960938 30.09375 -7.765625 C 28.8125 -5.566406 26.859375 -3.953125 24.234375 -2.921875 L 32.5625 -2.921875 L 32.5625 0 L 17.25 0 C 13.832031 0 11.023438 -0.644531 8.828125 -1.9375 C 6.628906 -3.238281 5.015625 -5.03125 3.984375 -7.3125 C 2.953125 -9.601562 2.4375 -12.222656 2.4375 -15.171875 Z M 6.28125 -15.171875 C 6.28125 -11.078125 7.15625 -8.03125 8.90625 -6.03125 C 10.664062 -4.039062 13.445312 -3.046875 17.25 -3.046875 C 21.019531 -3.046875 23.78125 -4.039062 25.53125 -6.03125 C 27.289062 -8.03125 28.171875 -11.078125 28.171875 -15.171875 C 28.171875 -19.273438 27.289062 -22.296875 25.53125 -24.234375 C 23.78125 -26.179688 21.019531 -27.15625 17.25 -27.15625 C 13.445312 -27.15625 10.664062 -26.179688 8.90625 -24.234375 C 7.15625 -22.296875 6.28125 -19.273438 6.28125 -15.171875 Z M 6.28125 -15.171875 "/></g><g transform="translate(1136.272924, 859.444586)"><path d="M 2.96875 -10.53125 L 2.96875 -29.421875 L 6.59375 -29.421875 L 6.59375 -10.96875 C 6.59375 -8.726562 6.898438 -6.976562 7.515625 -5.71875 C 8.140625 -4.46875 9.070312 -3.59375 10.3125 -3.09375 C 11.550781 -2.59375 13.082031 -2.34375 14.90625 -2.34375 C 16.738281 -2.34375 18.265625 -2.59375 19.484375 -3.09375 C 20.710938 -3.59375 21.632812 -4.46875 22.25 -5.71875 C 22.863281 -6.976562 23.171875 -8.726562 23.171875 -10.96875 L 23.171875 -29.421875 L 26.84375 -29.421875 L 26.84375 -10.53125 C 26.84375 -6.957031 25.878906 -4.191406 23.953125 -2.234375 C 22.023438 -0.273438 19.007812 0.703125 14.90625 0.703125 C 10.8125 0.703125 7.796875 -0.265625 5.859375 -2.203125 C 3.929688 -4.148438 2.96875 -6.925781 2.96875 -10.53125 Z M 2.96875 -10.53125 "/></g><g transform="translate(1166.037402, 859.444586)"><path d="M 19.0625 -26.453125 L 12.828125 -26.453125 L 12.828125 -2.96875 L 19.0625 -2.96875 L 19.0625 0 L 2.96875 0 L 2.96875 -2.96875 L 9.203125 -2.96875 L 9.203125 -26.453125 L 2.96875 -26.453125 L 2.96875 -29.421875 L 19.0625 -29.421875 Z M 19.0625 -26.453125 "/></g><g transform="translate(1188.062241, 859.444586)"><path d="M 26.234375 -29.421875 L 26.234375 -26.453125 L 15.703125 -26.453125 L 15.703125 0.046875 L 12.078125 0.046875 L 12.078125 -26.453125 L 1.453125 -26.453125 L 1.453125 -29.421875 Z M 26.234375 -29.421875 "/></g><g transform="translate(1215.792326, 859.444586)"><path d="M 6.671875 -2.96875 L 24.90625 -2.96875 L 24.90625 0 L 3.015625 0 L 3.015625 -29.421875 L 24.765625 -29.421875 L 24.765625 -26.453125 L 6.671875 -26.453125 L 6.671875 -16.59375 L 23.4375 -16.59375 L 23.4375 -13.671875 L 6.671875 -13.671875 Z M 6.671875 -2.96875 "/></g><g transform="translate(1243.478145, 859.444586)"><path d="M 26.234375 -29.421875 L 26.234375 -26.453125 L 15.703125 -26.453125 L 15.703125 0.046875 L 12.078125 0.046875 L 12.078125 -26.453125 L 1.453125 -26.453125 L 1.453125 -29.421875 Z M 26.234375 -29.421875 "/></g><g transform="translate(1271.208231, 859.444586)"><path d="M 17.078125 0.75 C 13.679688 0.75 10.898438 0.0820312 8.734375 -1.25 C 6.566406 -2.59375 4.972656 -4.4375 3.953125 -6.78125 C 2.941406 -9.132812 2.4375 -11.785156 2.4375 -14.734375 C 2.4375 -17.648438 2.941406 -20.28125 3.953125 -22.625 C 4.972656 -24.96875 6.566406 -26.816406 8.734375 -28.171875 C 10.898438 -29.535156 13.679688 -30.21875 17.078125 -30.21875 C 20.492188 -30.21875 23.273438 -29.53125 25.421875 -28.15625 C 27.578125 -26.78125 29.171875 -24.925781 30.203125 -22.59375 C 31.242188 -20.269531 31.765625 -17.648438 31.765625 -14.734375 C 31.765625 -11.785156 31.242188 -9.144531 30.203125 -6.8125 C 29.171875 -4.476562 27.578125 -2.632812 25.421875 -1.28125 C 23.273438 0.0703125 20.492188 0.75 17.078125 0.75 Z M 6.28125 -14.734375 C 6.28125 -10.597656 7.140625 -7.488281 8.859375 -5.40625 C 10.585938 -3.332031 13.328125 -2.296875 17.078125 -2.296875 C 20.847656 -2.296875 23.59375 -3.332031 25.3125 -5.40625 C 27.039062 -7.488281 27.90625 -10.597656 27.90625 -14.734375 C 27.90625 -18.859375 27.039062 -21.957031 25.3125 -24.03125 C 23.59375 -26.113281 20.847656 -27.15625 17.078125 -27.15625 C 13.328125 -27.15625 10.585938 -26.113281 8.859375 -24.03125 C 7.140625 -21.957031 6.28125 -18.859375 6.28125 -14.734375 Z M 6.28125 -14.734375 "/></g><g transform="translate(1305.395392, 859.444586)"><path d="M 24.421875 -29.421875 L 28.046875 -29.421875 L 28.046875 0 L 21.890625 0 L 8.53125 -23.09375 C 7.800781 -24.507812 7.179688 -25.789062 6.671875 -26.9375 L 6.671875 0 L 3.015625 0 L 3.015625 -29.421875 L 9.203125 -29.421875 L 22.5625 -6.28125 C 22.851562 -5.78125 23.160156 -5.191406 23.484375 -4.515625 C 23.804688 -3.835938 24.117188 -3.160156 24.421875 -2.484375 Z M 24.421875 -29.421875 "/></g><g transform="translate(1336.486652, 859.444586)"><path d="M 19.0625 -26.453125 L 12.828125 -26.453125 L 12.828125 -2.96875 L 19.0625 -2.96875 L 19.0625 0 L 2.96875 0 L 2.96875 -2.96875 L 9.203125 -2.96875 L 9.203125 -26.453125 L 2.96875 -26.453125 L 2.96875 -29.421875 L 19.0625 -29.421875 Z M 19.0625 -26.453125 "/></g><g transform="translate(1358.511492, 859.444586)"><path d="M 17.125 0.75 C 13.757812 0.75 10.992188 0.0820312 8.828125 -1.25 C 6.660156 -2.59375 5.050781 -4.429688 4 -6.765625 C 2.957031 -9.097656 2.4375 -11.753906 2.4375 -14.734375 C 2.4375 -17.679688 2.96875 -20.316406 4.03125 -22.640625 C 5.09375 -24.972656 6.710938 -26.816406 8.890625 -28.171875 C 11.078125 -29.535156 13.847656 -30.21875 17.203125 -30.21875 C 21.742188 -30.21875 25.101562 -29.171875 27.28125 -27.078125 C 29.46875 -24.984375 30.738281 -22.109375 31.09375 -18.453125 L 27.375 -18.453125 C 27.082031 -21.335938 26.09375 -23.507812 24.40625 -24.96875 C 22.726562 -26.425781 20.300781 -27.15625 17.125 -27.15625 C 13.46875 -27.15625 10.742188 -26.113281 8.953125 -24.03125 C 7.171875 -21.957031 6.28125 -18.859375 6.28125 -14.734375 C 6.28125 -10.628906 7.15625 -7.53125 8.90625 -5.4375 C 10.664062 -3.34375 13.375 -2.296875 17.03125 -2.296875 C 20.363281 -2.296875 22.882812 -3.117188 24.59375 -4.765625 C 26.300781 -6.421875 27.257812 -8.738281 27.46875 -11.71875 L 31.234375 -11.71875 C 31.085938 -9.238281 30.492188 -7.0625 29.453125 -5.1875 C 28.421875 -3.320312 26.894531 -1.863281 24.875 -0.8125 C 22.863281 0.226562 20.28125 0.75 17.125 0.75 Z M 17.125 0.75 "/></g><g transform="translate(1391.946776, 859.444586)"><path d="M 25.65625 0 L 22.78125 -7.515625 L 8.1875 -7.515625 L 5.3125 0 L 1.640625 0 L 12.78125 -29.421875 L 18.21875 -29.421875 L 29.375 0 Z M 9.296875 -10.484375 L 21.671875 -10.484375 L 15.484375 -26.765625 Z M 9.296875 -10.484375 "/></g></g><g transform="matrix(1, 0, 0, 1, 201, 552)"><g clip-path="url(#vc4d)"><g clip-path="url(#vca9)"><path fill="#f77f00" d="M 430.371094 1.171875 L 315.457031 1.171875 L 271.160156 133.867188 L 345.808594 68.617188 L 249.449219 309.003906 L 281.195312 383.390625 Z M 430.371094 1.171875 " fill-rule="nonzero"/></g><g clip-path="url(#vcf6)"><path fill="#f77f00" d="M 0.421875 1.429688 C 16.902344 40.433594 150.515625 355.984375 167.566406 394.828125 L 266.867188 394.828125 L 201.621094 223.480469 L 199.019531 316.566406 C 188.519531 291.65625 95.5625 53.433594 95.5625 53.433594 L 165.746094 118.4375 L 118.4375 1.171875 Z M 0.421875 1.429688 " fill-rule="nonzero"/></g><g clip-path="url(#vc79)"><path fill="#0d0d0d" d="M 439.117188 1.171875 L 324.207031 1.171875 L 279.90625 133.867188 L 354.554688 68.617188 L 258.199219 309.003906 L 289.941406 383.390625 Z M 439.117188 1.171875 " fill-rule="nonzero"/></g><g clip-path="url(#vc67)"><path fill="#0d0d0d" d="M 9.171875 1.429688 C 25.652344 40.433594 159.261719 355.984375 176.316406 394.828125 L 275.613281 394.828125 L 210.367188 223.480469 L 207.769531 316.566406 C 197.265625 291.65625 104.3125 53.433594 104.3125 53.433594 L 174.496094 118.4375 L 127.1875 1.171875 Z M 9.171875 1.429688 " fill-rule="nonzero"/></g></g></g></svg>`;

// ── Esquemas técnicos por tipo (mesmos do template) ──
function esquema(icone: string, _larg?: number | null, _alt?: number | null): string {
  switch (icone) {
    case "gate": return `<svg width="80" height="65" viewBox="0 0 80 65" fill="none"><rect x="2" y="10" width="76" height="52" rx="1" stroke="#0d0d0d" stroke-width="2.5" fill="none"/><line x1="40" y1="10" x2="40" y2="62" stroke="#0d0d0d" stroke-width="1.5"/><line x1="2" y1="28" x2="38" y2="28" stroke="#0d0d0d" stroke-width="1"/><line x1="42" y1="28" x2="78" y2="28" stroke="#0d0d0d" stroke-width="1"/><line x1="2" y1="46" x2="38" y2="46" stroke="#0d0d0d" stroke-width="1"/><line x1="42" y1="46" x2="78" y2="46" stroke="#0d0d0d" stroke-width="1"/><circle cx="37" cy="37" r="3" stroke="#f77f00" stroke-width="1.5" fill="none"/><circle cx="43" cy="37" r="3" stroke="#f77f00" stroke-width="1.5" fill="none"/><rect x="0" y="6" width="5" height="55" rx="1" fill="#0d0d0d"/><rect x="75" y="6" width="5" height="55" rx="1" fill="#0d0d0d"/></svg>`;
    case "grade": return `<svg width="80" height="65" viewBox="0 0 80 65" fill="none"><rect x="2" y="4" width="76" height="58" rx="1" stroke="#0d0d0d" stroke-width="2.5" fill="none"/><line x1="16" y1="4" x2="16" y2="62" stroke="#0d0d0d" stroke-width="1.5"/><line x1="30" y1="4" x2="30" y2="62" stroke="#0d0d0d" stroke-width="1.5"/><line x1="44" y1="4" x2="44" y2="62" stroke="#0d0d0d" stroke-width="1.5"/><line x1="58" y1="4" x2="58" y2="62" stroke="#0d0d0d" stroke-width="1.5"/><line x1="72" y1="4" x2="72" y2="62" stroke="#0d0d0d" stroke-width="1.5"/><line x1="2" y1="21" x2="78" y2="21" stroke="#f77f00" stroke-width="1"/><line x1="2" y1="43" x2="78" y2="43" stroke="#f77f00" stroke-width="1"/></svg>`;
    case "stairs": return `<svg width="80" height="65" viewBox="0 0 80 65" fill="none"><line x1="15" y1="5" x2="15" y2="60" stroke="#0d0d0d" stroke-width="3"/><line x1="65" y1="5" x2="65" y2="60" stroke="#0d0d0d" stroke-width="3"/><line x1="15" y1="16" x2="65" y2="16" stroke="#0d0d0d" stroke-width="2"/><line x1="15" y1="27" x2="65" y2="27" stroke="#0d0d0d" stroke-width="2"/><line x1="15" y1="38" x2="65" y2="38" stroke="#0d0d0d" stroke-width="2"/><line x1="15" y1="49" x2="65" y2="49" stroke="#0d0d0d" stroke-width="2"/><rect x="13" y="3" width="4" height="4" fill="#f77f00"/><rect x="63" y="3" width="4" height="4" fill="#f77f00"/><rect x="13" y="58" width="4" height="4" fill="#f77f00"/><rect x="63" y="58" width="4" height="4" fill="#f77f00"/></svg>`;
    case "cover": return `<svg width="80" height="65" viewBox="0 0 80 65" fill="none"><rect x="4" y="10" width="72" height="48" rx="2" stroke="#0d0d0d" stroke-width="2.5" fill="none"/><line x1="4" y1="10" x2="76" y2="58" stroke="#0d0d0d" stroke-width="1" stroke-dasharray="4,3"/><line x1="76" y1="10" x2="4" y2="58" stroke="#0d0d0d" stroke-width="1" stroke-dasharray="4,3"/><circle cx="40" cy="34" r="5" stroke="#f77f00" stroke-width="2" fill="none"/><rect x="0" y="8" width="80" height="4" fill="#0d0d0d" rx="1"/><rect x="0" y="56" width="80" height="4" fill="#0d0d0d" rx="1"/></svg>`;
    case "rail": return `<svg width="80" height="65" viewBox="0 0 80 65" fill="none"><path d="M5 20 Q40 10 75 20" stroke="#0d0d0d" stroke-width="3" fill="none"/><line x1="15" y1="20" x2="15" y2="55" stroke="#0d0d0d" stroke-width="2"/><line x1="40" y1="15" x2="40" y2="55" stroke="#0d0d0d" stroke-width="2"/><line x1="65" y1="20" x2="65" y2="55" stroke="#0d0d0d" stroke-width="2"/><line x1="5" y1="55" x2="75" y2="55" stroke="#f77f00" stroke-width="3"/></svg>`;
    case "struct": return `<svg width="80" height="65" viewBox="0 0 80 65" fill="none"><line x1="5" y1="60" x2="75" y2="60" stroke="#0d0d0d" stroke-width="2"/><line x1="5" y1="60" x2="5" y2="10" stroke="#0d0d0d" stroke-width="2"/><line x1="75" y1="60" x2="75" y2="10" stroke="#0d0d0d" stroke-width="2"/><line x1="5" y1="10" x2="75" y2="10" stroke="#f77f00" stroke-width="3"/><line x1="5" y1="35" x2="75" y2="35" stroke="#0d0d0d" stroke-width="1" stroke-dasharray="4,3"/><line x1="40" y1="60" x2="40" y2="10" stroke="#0d0d0d" stroke-width="1.5"/><line x1="22" y1="60" x2="22" y2="35" stroke="#0d0d0d" stroke-width="1.5"/><line x1="58" y1="60" x2="58" y2="35" stroke="#0d0d0d" stroke-width="1.5"/></svg>`;
    case "window": return `<svg width="80" height="65" viewBox="0 0 80 65" fill="none"><rect x="4" y="4" width="72" height="58" rx="1" stroke="#0d0d0d" stroke-width="2.5" fill="rgba(200,230,255,0.3)"/><line x1="40" y1="4" x2="40" y2="62" stroke="#0d0d0d" stroke-width="1.5"/><line x1="4" y1="33" x2="78" y2="33" stroke="#0d0d0d" stroke-width="1.5"/><line x1="40" y1="16" x2="52" y2="4" stroke="#f77f00" stroke-width="1.5" stroke-dasharray="3,2"/></svg>`;
    default: return `<svg width="80" height="65" viewBox="0 0 80 65" fill="none"><rect x="10" y="8" width="60" height="50" rx="2" stroke="#0d0d0d" stroke-width="2" fill="none"/><line x1="10" y1="8" x2="70" y2="58" stroke="#0d0d0d" stroke-width="1" stroke-dasharray="4,3"/><line x1="70" y1="8" x2="10" y2="58" stroke="#0d0d0d" stroke-width="1" stroke-dasharray="4,3"/><circle cx="40" cy="33" r="8" stroke="#f77f00" stroke-width="2" fill="none"/><line x1="40" y1="25" x2="40" y2="41" stroke="#f77f00" stroke-width="1.5"/><line x1="32" y1="33" x2="48" y2="33" stroke="#f77f00" stroke-width="1.5"/></svg>`;
  }
}

function esc(str: unknown): string {
  if (str === null || str === undefined) return "";
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--preto:#0d0d0d;--laranja:#f77f00;--creme:#f5f0e8;--cinza:#5c5c5c;--borda:#d0c8bc;--branco:#fff}
body{font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.4;color:var(--preto);background:#e9e9e9;display:flex;justify-content:center;padding:24px}
.doc{background:#fff;width:800px;border:2px solid #0d0d0d}
.doc-header{display:flex;align-items:flex-start;justify-content:space-between;padding:20px 24px 16px;border-bottom:3px solid var(--preto)}
.doc-empresa{text-align:right}
.doc-empresa .emp-nome{font-size:14px;font-weight:900;color:var(--preto);letter-spacing:.5px}
.doc-empresa .emp-dados{font-size:11px;color:var(--cinza);margin-top:4px;line-height:1.6}
.doc-empresa .emp-dados strong{color:var(--preto)}
.orc-badge{display:inline-block;background:var(--preto);color:var(--branco);font-size:11px;font-weight:700;padding:3px 10px;letter-spacing:1px;text-transform:uppercase;margin-top:8px}
.orc-num{color:var(--laranja)}
.doc-stripe{height:4px;background:var(--laranja)}
.doc-cliente{display:flex;align-items:stretch;border-bottom:2px solid var(--preto)}
.doc-cliente-info{flex:1;padding:14px 24px}
.cli-titulo{font-size:16px;font-weight:900;color:var(--preto);margin-bottom:6px}
.cli-dado{font-size:11px;color:var(--cinza);margin-bottom:3px}
.cli-dado strong{color:var(--preto);font-size:12px}
.doc-cliente-meta{width:200px;background:var(--creme);border-left:2px solid var(--preto);padding:14px 16px;display:flex;flex-direction:column;justify-content:center;gap:8px}
.meta-item{font-size:10px}
.meta-item .meta-label{color:var(--cinza);text-transform:uppercase;letter-spacing:.5px;font-weight:700;display:block}
.meta-item .meta-val{font-size:13px;font-weight:900;color:var(--preto)}
.doc-produtos-header{background:var(--preto);color:var(--branco);padding:8px 24px;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase}
.doc-item{display:flex;border-bottom:1px solid var(--borda)}
.doc-item:last-child{border-bottom:none}
.item-esquema{width:110px;min-height:100px;background:var(--creme);border-right:1px solid var(--borda);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:10px}
.item-num-badge{font-size:11px;font-weight:900;color:var(--branco);background:var(--preto);width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center}
.item-body{flex:1;padding:12px 20px}
.item-nome{font-size:13px;font-weight:900;color:var(--preto);margin-bottom:7px;text-transform:uppercase}
.item-specs{display:grid;grid-template-columns:repeat(3,1fr);gap:6px 14px;margin-bottom:8px}
.item-spec{font-size:11px}
.item-spec .sp-label{font-weight:700;color:var(--preto);margin-right:3px}
.item-spec .sp-val{color:var(--cinza)}
.item-obs{font-size:10px;color:var(--cinza);font-style:italic;margin-top:4px}
.item-precos{min-width:150px;background:var(--creme);border-left:1px solid var(--borda);display:flex;flex-direction:column;justify-content:center;align-items:flex-end;padding:12px 16px;gap:8px}
.preco-bloco{text-align:right}
.preco-label{font-size:9px;text-transform:uppercase;letter-spacing:.5px;color:var(--cinza);font-weight:700;display:block}
.preco-val{font-size:12px;font-weight:900;color:var(--preto)}
.preco-total{font-size:14px;color:var(--laranja)}
.doc-ajustes{border-top:1px solid var(--borda)}
.ajuste-linha{display:flex;justify-content:space-between;padding:6px 24px;font-size:11px;border-bottom:1px solid var(--borda);color:var(--cinza)}
.ajuste-linha:last-child{border-bottom:none}
.ajuste-val{font-weight:700;color:var(--preto)}
.doc-footer{display:flex;border-top:3px solid var(--preto)}
.doc-footer-info{flex:1;padding:14px 24px;display:flex;gap:30px}
.footer-label{font-size:10px;font-weight:700;color:var(--preto);text-transform:uppercase;letter-spacing:.5px}
.footer-val{font-size:13px;color:var(--cinza);margin-top:2px}
.doc-footer-total{min-width:220px;background:var(--preto);color:var(--branco);padding:14px 20px;display:flex;flex-direction:column;justify-content:center;align-items:flex-end}
.total-label{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#888}
.total-val{font-size:26px;font-weight:900;color:var(--laranja);letter-spacing:-.5px}
.doc-condicoes{padding:12px 24px;background:var(--creme);border-top:2px solid var(--preto);font-size:10px;color:var(--cinza)}
.doc-condicoes strong{color:var(--preto)}
.doc-assinaturas{display:flex;gap:40px;padding:30px 60px 20px;border-top:1px solid var(--borda)}
.assinatura{flex:1;text-align:center}
.assinatura-linha{border-top:1.5px solid var(--preto);padding-top:8px;margin-top:40px}
.assinatura-nome{font-size:12px;font-weight:700;color:var(--preto)}
.assinatura-cargo{font-size:10px;color:var(--cinza)}
.doc-rodape{background:var(--preto);padding:8px 24px;display:flex;justify-content:space-between;align-items:center}
.rodape-marca{font-size:10px;font-weight:700;color:#444;letter-spacing:1px;text-transform:uppercase}
.rodape-marca span{color:var(--laranja)}
@media print{*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}@page{margin:8mm;size:A4}body{background:#fff;padding:0}.doc{width:100%;border:2px solid #000}}
`;

/** Monta o documento HTML completo do orçamento (testável, sem efeitos colaterais). */
export function buildOrcamentoHtml(
  orcamento: Orcamento,
  items: OrcamentoItem[],
  cliente?: Cliente,
  local?: Local,
  ocultarUnitarios = false,
): string {
  const num = String(orcamento.numero || 0).padStart(3, "0");
  const dataEmissao = orcamento.data_emissao ? formatDate(orcamento.data_emissao) : "—";

  const subtotal = items.reduce((s, i) => s + (i.valor_unitario || 0) * (i.quantidade || 0), 0);
  const desconto = subtotal * (orcamento.desconto_pct || 0) / 100;
  const baseImp = subtotal - desconto;
  const imposto = baseImp * (orcamento.imposto_pct || 0) / 100;
  const total = baseImp + imposto;

  const endereco = orcamento.endereco_obra || local?.endereco || "";
  const cliNome = cliente?.nome || "—";

  const itensHtml = items.length === 0
    ? `<div style="padding:40px;text-align:center;color:#bbb;font-size:13px">Nenhum item neste orçamento.</div>`
    : items.map((it, idx) => {
        const totalItem = (it.valor_unitario || 0) * (it.quantidade || 0);
        const dim = (it.largura_mm || it.altura_mm)
          ? [it.largura_mm ? it.largura_mm + "mm" : "", it.altura_mm ? it.altura_mm + "mm" : ""].filter(Boolean).join(" × ")
          : "—";
        const precos = ocultarUnitarios
          ? `<div class="preco-bloco"><span class="preco-label">Quantidade</span><span class="preco-val">${esc(it.quantidade)} ${esc(it.unidade || "")}</span></div>`
          : `<div class="preco-bloco"><span class="preco-label">Quantidade</span><span class="preco-val">${esc(it.quantidade)} ${esc(it.unidade || "")}</span></div>
             <div class="preco-bloco"><span class="preco-label">Valor Unitário</span><span class="preco-val">${fmt(it.valor_unitario || 0)}</span></div>
             <div class="preco-bloco"><span class="preco-label">Valor Total</span><span class="preco-val preco-total">${fmt(totalItem)}</span></div>`;
        return `<div class="doc-item">
          <div class="item-esquema"><div class="item-num-badge">${idx + 1}</div>${esquema(it.icone || "other", it.largura_mm, it.altura_mm)}</div>
          <div class="item-body">
            <div class="item-nome">${esc(it.nome)}</div>
            <div class="item-specs">
              <div class="item-spec"><span class="sp-label">DIMENSÕES:</span><span class="sp-val">${dim}</span></div>
              ${it.material ? `<div class="item-spec"><span class="sp-label">MATERIAL:</span><span class="sp-val">${esc(it.material)}</span></div>` : ""}
              ${it.acabamento ? `<div class="item-spec"><span class="sp-label">ACABAMENTO:</span><span class="sp-val">${esc(it.acabamento)}</span></div>` : ""}
              ${it.cor ? `<div class="item-spec"><span class="sp-label">COR:</span><span class="sp-val">${esc(it.cor)}</span></div>` : ""}
            </div>
            ${it.observacao ? `<div class="item-obs">ℹ ${esc(it.observacao)}</div>` : ""}
          </div>
          <div class="item-precos">${precos}</div>
        </div>`;
      }).join("");

  const ajustesHtml = items.length === 0 ? "" : `
    <div class="doc-ajustes">
      <div class="ajuste-linha"><span>Subtotal</span><span class="ajuste-val">${fmt(subtotal)}</span></div>
      ${(orcamento.desconto_pct || 0) > 0 ? `<div class="ajuste-linha"><span>Desconto (${orcamento.desconto_pct}%)</span><span class="ajuste-val" style="color:#22a06b">- ${fmt(desconto)}</span></div>` : ""}
      ${(orcamento.imposto_pct || 0) > 0 ? `<div class="ajuste-linha"><span>Impostos / Taxas (${orcamento.imposto_pct}%)</span><span class="ajuste-val">${fmt(imposto)}</span></div>` : ""}
    </div>`;

  const obsHtml = orcamento.observacoes
    ? `<div class="footer-bloco"><div class="footer-label">Observações</div><div class="footer-val" style="font-size:11px;max-width:400px;line-height:1.5">${esc(orcamento.observacoes)}</div></div>`
    : "";

  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Orçamento #${num} — VULCANO</title><style>${CSS}</style></head><body>
  <div class="doc">
    <div class="doc-header">
      <div class="doc-logo">${LOGO_SVG}</div>
      <div class="doc-empresa">
        <div class="emp-nome">${EMPRESA.nome}</div>
        <div class="emp-dados"><strong>CNPJ:</strong> ${EMPRESA.cnpj}<br><strong>EMAIL:</strong> ${EMPRESA.email}<br><strong>CELULAR:</strong> ${EMPRESA.celular}</div>
        <div style="margin-top:8px"><span class="orc-badge">ORÇAMENTO <span class="orc-num">#${num}</span></span> <span style="font-size:11px;color:#888;margin-left:10px">${dataEmissao}</span></div>
      </div>
    </div>
    <div class="doc-stripe"></div>
    <div class="doc-cliente">
      <div class="doc-cliente-info">
        <div class="cli-titulo">${esc(cliNome)}</div>
        ${endereco ? `<div class="cli-dado"><strong>ENDEREÇO:</strong> ${esc(endereco)}</div>` : ""}
        ${cliente?.telefone ? `<div class="cli-dado"><strong>CELULAR:</strong> ${esc(cliente.telefone)}</div>` : ""}
        ${cliente?.cpf_cnpj ? `<div class="cli-dado"><strong>CPF/CNPJ:</strong> ${esc(cliente.cpf_cnpj)}</div>` : ""}
      </div>
      <div class="doc-cliente-meta">
        <div class="meta-item"><span class="meta-label">Prev. Entrega</span><span class="meta-val">${esc(orcamento.prazo_execucao || "—")}</span></div>
        <div class="meta-item"><span class="meta-label">Válido até</span><span class="meta-val">${orcamento.validade ? formatDate(orcamento.validade) : "—"}</span></div>
        <div class="meta-item"><span class="meta-label">Pagamento</span><span class="meta-val" style="font-size:11px">${esc(orcamento.condicoes_pagamento || "—")}</span></div>
      </div>
    </div>
    <div class="doc-produtos-header">PRODUTOS / SERVIÇOS</div>
    <div class="doc-itens">${itensHtml}</div>
    ${ajustesHtml}
    <div class="doc-footer">
      <div class="doc-footer-info">${obsHtml}</div>
      <div class="doc-footer-total"><div class="total-label">TOTAL DO ORÇAMENTO</div><div class="total-val">${fmt(total)}</div></div>
    </div>
    <div class="doc-condicoes">
      <strong>Condições Gerais:</strong>
      O presente orçamento não constitui pedido de compra. Preços sujeitos a alteração sem aviso prévio após o período de validade.
      Frete, içamento e fundações não estão incluídos, salvo quando especificado. Garantia de 1 ano contra defeitos de fabricação.
      ${orcamento.exclusoes ? `<br><br><strong>Não incluso:</strong> ${esc(orcamento.exclusoes)}` : ""}
      ${orcamento.responsabilidades ? `<br><br><strong>Responsabilidades do contratante:</strong> ${esc(orcamento.responsabilidades)}` : ""}
    </div>
    <div class="doc-assinaturas">
      <div class="assinatura"><div class="assinatura-linha"><div class="assinatura-nome">${cliNome !== "—" ? esc(cliNome.toUpperCase()) : "CLIENTE"}</div><div class="assinatura-cargo"></div></div></div>
      <div class="assinatura"><div class="assinatura-linha"><div class="assinatura-nome">${EMPRESA.nome}</div><div class="assinatura-cargo">Representante</div></div></div>
    </div>
    <div class="doc-rodape"><div class="rodape-marca"><span>VULCANO</span> — Metalurgia Arquitetônica</div><div class="rodape-marca">Orçamento #${num} — ${dataEmissao}</div></div>
  </div>
  </body></html>`;

  return html;
}

/** Abre o orçamento numa janela e dispara o diálogo de impressão (Salvar como PDF). */
export function printOrcamento(
  orcamento: Orcamento,
  items: OrcamentoItem[],
  cliente?: Cliente,
  local?: Local,
  ocultarUnitarios = false,
) {
  const html = buildOrcamentoHtml(orcamento, items, cliente, local, ocultarUnitarios).replace(
    "</body></html>",
    `<script>window.onload=function(){setTimeout(function(){window.focus();window.print();},300);};</script></body></html>`,
  );
  const w = window.open("", "_blank", "width=900,height=1000");
  if (!w) {
    throw new Error("Não foi possível abrir a janela de impressão. Permita pop-ups para este site.");
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
}
