const fs = require('fs')
const path = require('path')

describe('Testing if .env is working', () => {
    const envPath = path.resolve(__dirname, '../../.env')

    test('.env file should exist', () => {
        const fileExists = fs.existsSync(envPath)
        expect(fileExists).toBe(true)
    })

    test('dotenv should load environment variable Redis IP Address', () => {
        require('dotenv').config({ path: envPath })

        expect(process.env.REDIS_HOST_IP).toBeDefined()
    })

    test('dotenv should load environment variable Redis Port', () => {
        require('dotenv').config({ path: envPath })

        expect(process.env.REDIS_PORT).toBeDefined()
    })

    test('dotenv should load environment variable Redis User', () => {
        require('dotenv').config({ path: envPath })

        expect(process.env.REDIS_USER_NAME).toBeDefined()
    })

    test('dotenv should load environment variable Redis Password', () => {
        require('dotenv').config({ path: envPath })

        expect(process.env.REDIS_USER_PASSWORD).toBeDefined()
    })
})

require('dotenv').config({ path: '../../.env' })

describe('All dependencies should be installed', () => {
    const packageJsonPath = path.resolve(__dirname, '../../package.json')
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))

    const dependencies = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
    }

    Object.keys(dependencies).forEach((dep) => {
        test(`${dep} should be installed`, () => {
            expect(() => require(dep)).not.toThrow()
        })
    })
})

const { execSync } = require("child_process")

describe('Testing Axios installation', () => {
    test('should import axios without errors', () => {
        let axios
        expect(() => {
            axios = require('axios')
        }).not.toThrow()

        expect(axios).toBeDefined()
        expect(typeof axios.get).toBe('function')
    })
})

const axios = require("axios")

describe(`Testing Docker Installation and Running`, () => {

    test("Check if Docker is installed on this machine", () => {

        try {
            const output = execSync("docker --version", { encoding: "utf-8" })
            expect(output).toMatch(/Docker version/)
        } catch (error) {
            throw new Error("Docker is not installed or not in PATH")
        }

    })

    test("Check if Docker is running at this moment", () => {

        try {
            const output = execSync("docker info", { encoding: "utf-8" })
            expect(output).toMatch(/Server Version/)
        } catch (error) {
            throw new Error("Docker is not running or not installed")
        }

    })

})

describe(`Testing Redis Connection for Host: ${process.env.REDIS_HOST_IP} Port: ${process.env.REDIS_PORT}`, () => {

   const url = `http://${process.env.REDIS_HOST_IP}:${process.env.REDIS_PORT}`

    it('should throw if database is turned off.', async () => {

        expect.assertions(1)

        try {
            await axios.get(url, { timeout: 2000 })
        } catch (error) {
          expect(['ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT']).toContain(error.code)
        }

    })

})
