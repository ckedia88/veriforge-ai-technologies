// ============================================================
//  VeriForge AI — Verilog "code rain" background generator
//  Renders faint, scrolling SystemVerilog columns behind the
//  hero and the 3D SoC scene.
// ============================================================

const VERILOG_LINES = [
  "module soc_top (",
  "  input  wire        clk,",
  "  input  wire        rst_n,",
  "  input  wire [31:0] axi_awaddr,",
  "  input  wire        axi_awvalid,",
  "  output reg         axi_awready,",
  "  output reg  [31:0] axi_rdata,",
  "  output wire        irq",
  ");",
  "  localparam IDLE = 2'b00;",
  "  localparam REQ  = 2'b01;",
  "  localparam ACK  = 2'b10;",
  "  reg [1:0] state, next_state;",
  "",
  "  always @(posedge clk or negedge rst_n)",
  "    if (!rst_n) state <= IDLE;",
  "    else        state <= next_state;",
  "",
  "  always @(*) begin",
  "    next_state = state;",
  "    case (state)",
  "      IDLE: if (axi_awvalid) next_state = REQ;",
  "      REQ :                  next_state = ACK;",
  "      ACK :                  next_state = IDLE;",
  "    endcase",
  "  end",
  "",
  "  assign valid   = handshake & ready;",
  "  assign axi_rdata = mem[addr[9:2]];",
  "  assign irq       = |pending;",
  "endmodule",
  "",
  "// UVM verification component",
  "class soc_scoreboard extends uvm_scoreboard;",
  "  `uvm_component_utils(soc_scoreboard)",
  "  uvm_analysis_imp #(seq_item, soc_scoreboard) ap;",
  "  function void write(seq_item t);",
  "    if (t.data !== expected[t.addr])",
  "      `uvm_error(\"SB\", \"data mismatch\")",
  "  endfunction",
  "endclass",
  "",
  "covergroup cg_axi @(posedge clk);",
  "  cp_addr : coverpoint axi_awaddr;",
  "  cp_len  : coverpoint axi_awlen { bins b[] = {[0:15]}; }",
  "  cross cp_addr, cp_len;",
  "endgroup",
  "",
  "property p_handshake;",
  "  @(posedge clk) req |-> ##[1:3] ack;",
  "endproperty",
  "assert property (p_handshake);",
];

const KEYWORDS = /\b(module|input|output|wire|reg|always|assign|begin|end|endmodule|case|endcase|localparam|posedge|negedge|if|else|class|extends|function|void|endfunction|covergroup|endgroup|coverpoint|cross|property|endproperty|assert|bins)\b/g;

function highlight(line) {
  return line
    .replace(/</g, "&lt;")
    .replace(KEYWORDS, '<span class="kw">$1</span>')
    .replace(/\b(\d+'[bhd][0-9a-fA-F_]+|\d+)\b/g, '<span class="num">$1</span>');
}

function buildColumn(startIndex, speed) {
  const col = document.createElement("div");
  col.className = "code-col";
  col.style.animationDuration = speed + "s";

  const chunk = [];
  for (let i = 0; i < 60; i++) {
    chunk.push(highlight(VERILOG_LINES[(startIndex + i) % VERILOG_LINES.length]));
  }
  // Duplicate content so the -50% scroll loops seamlessly.
  col.innerHTML = chunk.join("\n") + "\n" + chunk.join("\n");
  return col;
}

function fillCodeBg(el, columns, baseSpeed) {
  if (!el) return;
  el.innerHTML = "";
  for (let c = 0; c < columns; c++) {
    el.appendChild(buildColumn(c * 7, baseSpeed + c * 6));
  }
}

// Respect reduced-motion users: render static code, no animation.
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

fillCodeBg(document.getElementById("codeBg"), 6, reduceMotion ? 0 : 40);
fillCodeBg(document.getElementById("codeBgPanel"), 2, reduceMotion ? 0 : 30);

if (reduceMotion) {
  document.querySelectorAll(".code-col").forEach((c) => (c.style.animation = "none"));
}
