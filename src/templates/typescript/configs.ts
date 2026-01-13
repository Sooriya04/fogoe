// TypeScript Configuration Templates

// CommonJS tsconfig.json
export const tsConfigCommonJS = {
    compilerOptions: {
        target: "ES2020",
        module: "commonjs",
        outDir: "./dist",
        rootDir: "./src",
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        resolveJsonModule: true
    },
    include: ["src/**/*"],
    exclude: ["node_modules", "dist"]
};

// ES Module tsconfig.json (NodeNext)
export const tsConfigESModule = {
    compilerOptions: {
        target: "ES2022",
        module: "NodeNext",
        moduleResolution: "NodeNext",
        outDir: "./dist",
        rootDir: "./src",
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        resolveJsonModule: true
    },
    include: ["src/**/*"],
    exclude: ["node_modules", "dist"]
};

// Package.json templates

// Express CommonJS
export const packageJsonExpressCommonJS = {
    name: "fogoe-app",
    version: "1.0.0",
    description: "TypeScript Express application",
    main: "dist/index.js",
    scripts: {
        dev: "tsx src/index.ts",
        build: "tsc",
        start: "node dist/index.js"
    },
    dependencies: {
        express: "^4.18.2",
        cors: "^2.8.5",
        dotenv: "^16.3.1"
    },
    devDependencies: {
        "@types/node": "^20.10.0",
        "@types/express": "^4.17.21",
        "@types/cors": "^2.8.17",
        typescript: "^5.3.3",
        tsx: "^4.7.0"
    }
};

// Express ES Module
export const packageJsonExpressModule = {
    name: "fogoe-app",
    version: "1.0.0",
    description: "TypeScript Express application",
    type: "module",
    main: "dist/index.js",
    scripts: {
        dev: "tsx src/index.ts",
        build: "tsc",
        start: "node dist/index.js"
    },
    dependencies: {
        express: "^4.18.2",
        cors: "^2.8.5",
        dotenv: "^16.3.1"
    },
    devDependencies: {
        "@types/node": "^20.10.0",
        "@types/express": "^4.17.21",
        "@types/cors": "^2.8.17",
        typescript: "^5.3.3",
        tsx: "^4.7.0"
    }
};

// Fastify CommonJS
export const packageJsonFastifyCommonJS = {
    name: "fogoe-app",
    version: "1.0.0",
    description: "TypeScript Fastify application",
    main: "dist/index.js",
    scripts: {
        dev: "tsx src/index.ts",
        build: "tsc",
        start: "node dist/index.js"
    },
    dependencies: {
        fastify: "^4.25.0",
        "@fastify/cors": "^8.4.2",
        dotenv: "^16.3.1"
    },
    devDependencies: {
        "@types/node": "^20.10.0",
        typescript: "^5.3.3",
        tsx: "^4.7.0"
    }
};

// Fastify ES Module
export const packageJsonFastifyModule = {
    name: "fogoe-app",
    version: "1.0.0",
    description: "TypeScript Fastify application",
    type: "module",
    main: "dist/index.js",
    scripts: {
        dev: "tsx src/index.ts",
        build: "tsc",
        start: "node dist/index.js"
    },
    dependencies: {
        fastify: "^4.25.0",
        "@fastify/cors": "^8.4.2",
        dotenv: "^16.3.1"
    },
    devDependencies: {
        "@types/node": "^20.10.0",
        typescript: "^5.3.3",
        tsx: "^4.7.0"
    }
};
