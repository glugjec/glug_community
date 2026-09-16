import axios from 'axios';
import { LANGUAGES, extractAllErrorLines } from '../utils/languageConfig';

const RAPIDAPI_BASE = 'https://judge0-ce.p.rapidapi.com';
const PUBLIC_BASE = 'https://ce.judge0.com';

const STATUS = {
  IN_QUEUE: 1,
  PROCESSING: 2,
  ACCEPTED: 3,
  WRONG_ANSWER: 4,
  TLE: 5,
  COMPILATION_ERROR: 6,
  RUNTIME_SIGSEGV: 7,
  RUNTIME_SIGXFSZ: 8,
  RUNTIME_SIGFPE: 9,
  RUNTIME_SIGABRT: 10,
  RUNTIME_NZEC: 11,
  RUNTIME_OTHER: 12,
  INTERNAL_ERROR: 13,
  EXEC_FORMAT_ERROR: 14,
};

export async function executeCode(languageId, sourceCode, stdin = '', signal = null) {
  const lang = LANGUAGES[languageId];
  if (!lang) {
    throw new Error(`Unsupported language: ${languageId}`);
  }

  const apiKey = import.meta.env.VITE_JUDGE0_API_KEY;

  const url = apiKey
    ? `${RAPIDAPI_BASE}/submissions?base64_encoded=false&wait=true&fields=*`
    : `${PUBLIC_BASE}/submissions?base64_encoded=false&wait=true`;

  const headers = apiKey
    ? {
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
      }
    : {
        'Content-Type': 'application/json',
      };

  try {
    const response = await axios.post(
      url,
      {
        source_code: sourceCode,
        language_id: lang.judge0Id,
        stdin: stdin || undefined,
      },
      { headers, signal }
    );

    return parseResponse(response.data, languageId, sourceCode, stdin);
  } catch (error) {
    if (axios.isCancel(error) || error.name === 'CanceledError' || error.name === 'AbortError') {
      return {
        success: false,
        output: '',
        error: 'Execution cancelled by user.',
        statusDescription: 'Cancelled',
        statusId: -1,
        time: null,
        memory: null,
        errorLines: [],
        compilationError: false,
        runtimeError: false,
        timeLimitExceeded: false,
        isInputMissing: false,
      };
    }

    if (error.response) {
      const status = error.response.status;
      if (status === 429) {
        throw new Error('Rate limit exceeded. Please wait a moment and try again.');
      }
      if (status === 401 || status === 403) {
        throw new Error('API authorization error. Please check your API key.');
      }
      throw new Error(`Execution error (${status}): ${error.response.data?.message || error.response.data?.error || 'Unknown error'}`);
    }
    throw new Error(`Execution request failed: ${error.message}`);
  }
}

export function detectCodeNeedsInput(languageId, sourceCode) {
  if (!sourceCode) return false;

  const patterns = {
    python: /\b(input|sys\.stdin\.readline|sys\.stdin\.read)\b/,
    javascript: /\b(readline|prompt|process\.stdin)\b/,
    typescript: /\b(readline|prompt|process\.stdin)\b/,
    c: /\b(scanf|getchar|gets|fgets|cin)\b/,
    cpp: /\b(cin|scanf|getchar|getline)\b/,
    java: /\b(Scanner|BufferedReader|System\.in)\b/,
    csharp: /\b(Console\.ReadLine|Console\.Read)\b/,
    go: /\b(Scan|Scanf|Scanln|bufio\.NewReader)\b/,
    rust: /\b(stdin|read_line)\b/,
    ruby: /\b(gets|readline)\b/,
    php: /\b(readline|fgets|STDIN)\b/,
  };

  const pattern = patterns[languageId];
  return pattern ? pattern.test(sourceCode) : false;
}

export function isMissingInputError(stderr = '', stdout = '') {
  const combined = (stderr + ' ' + stdout).toLowerCase();
  return (
    combined.includes('eoferror') ||
    combined.includes('nosuchelementexception') ||
    combined.includes('inputmismatchexception') ||
    combined.includes('no line found') ||
    combined.includes('no such line') ||
    combined.includes('end of file') ||
    combined.includes('eof when reading') ||
    combined.includes('input past end') ||
    combined.includes('unexpected end of stream') ||
    combined.includes('scan error') ||
    combined.includes('unexpected eof')
  );
}

function parseResponse(data, languageId, sourceCode = '', stdin = '') {
  const statusId = data.status?.id;
  const isError =
    statusId === STATUS.COMPILATION_ERROR ||
    (statusId >= STATUS.RUNTIME_SIGSEGV && statusId <= STATUS.RUNTIME_OTHER) ||
    statusId === STATUS.TLE ||
    statusId === STATUS.INTERNAL_ERROR;

  let stderr = data.stderr || data.compile_output || '';
  const stdout = data.stdout || '';

  if (languageId === 'java' && stderr.includes('is public, should be declared in a file named')) {
    stderr += '\n💡 Tip: Online compilers like Judge0 require the main class to be named "Main" (e.g. `public class Main { ... }`). Please change your class name to `Main`.\n';
  }

  const errorLines = isError ? extractAllErrorLines(languageId, stderr) : [];

  const inputMissing = (isError && isMissingInputError(stderr, stdout)) ||
    (!stdin.trim() && detectCodeNeedsInput(languageId, sourceCode) && !stdout.trim() && statusId === STATUS.TLE);

  return {
    success: !isError,
    output: stdout,
    error: stderr,
    statusDescription: data.status?.description || 'Unknown',
    statusId,
    time: data.time ? `${data.time}s` : null,
    memory: data.memory ? `${(data.memory / 1024).toFixed(1)} MB` : null,
    errorLines,
    compilationError: statusId === STATUS.COMPILATION_ERROR,
    runtimeError: statusId >= STATUS.RUNTIME_SIGSEGV && statusId <= STATUS.RUNTIME_OTHER,
    timeLimitExceeded: statusId === STATUS.TLE,
    isInputMissing: inputMissing,
  };
}

function getMockResponse(languageId, sourceCode) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const hasError = detectMockError(languageId, sourceCode);

      if (hasError) {
        resolve({
          success: false,
          output: '',
          error: hasError.message,
          statusDescription: hasError.type,
          statusId: hasError.type === 'Compilation Error' ? STATUS.COMPILATION_ERROR : STATUS.RUNTIME_NZEC,
          time: '0.001s',
          memory: '0.5 MB',
          errorLines: hasError.lines,
          compilationError: hasError.type === 'Compilation Error',
          runtimeError: hasError.type !== 'Compilation Error',
          timeLimitExceeded: false,
        });
      } else {
        const outputs = {
          python: 'Hello from Python!\n',
          javascript: 'Hello from JavaScript!\n',
          typescript: 'Hello from TypeScript!\n',
          c: 'Hello from C!\n',
          cpp: 'Hello from C++!\n',
          java: 'Hello from Java!\n',
          csharp: 'Hello from C#!\n',
          go: 'Hello from Go!\n',
          rust: 'Hello from Rust!\n',
          ruby: 'Hello from Ruby!\n',
          php: 'Hello from PHP!\n',
        };
        resolve({
          success: true,
          output: outputs[languageId] || 'Program executed successfully.\n',
          error: '',
          statusDescription: 'Accepted',
          statusId: STATUS.ACCEPTED,
          time: '0.032s',
          memory: '3.2 MB',
          errorLines: [],
          compilationError: false,
          runtimeError: false,
          timeLimitExceeded: false,
        });
      }
    }, 800 + Math.random() * 700);
  });
}

function detectMockError(languageId, sourceCode) {
  const lines = sourceCode.split('\n');

  if (languageId === 'python') {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line && !line.startsWith('#') && !line.startsWith('"""') && !line.startsWith("'''")) {
        if (/^(def|if|for|while|class|elif|else|try|except|finally)\b/.test(line) && !line.endsWith(':') && !line.endsWith(':\\')) {
          return {
            type: 'Compilation Error',
            message: `  File "main.py", line ${i + 1}\n    ${line}\n                     ^\nSyntaxError: expected ':'`,
            lines: [i + 1],
          };
        }
      }
    }
  }

  if (['c', 'cpp'].includes(languageId)) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line && !line.startsWith('//') && !line.startsWith('#') &&
          !line.startsWith('{') && !line.startsWith('}') &&
          !line.endsWith('{') && !line.endsWith('}') &&
          !line.endsWith(';') && !line.endsWith(',') &&
          !line.endsWith('\\') && !line.endsWith(':') &&
          !line.includes('//') &&
          /\w/.test(line) &&
          /(return|printf|cout|int |char |float |double |void )/.test(line)) {
        return {
          type: 'Compilation Error',
          message: `main.${languageId === 'c' ? 'c' : 'cpp'}:${i + 1}:${line.length}: error: expected ';' at end of statement\n    ${line}\n    ${' '.repeat(line.length - 1)}^`,
          lines: [i + 1],
        };
      }
    }
  }

  return null;
}
