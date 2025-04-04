require('dotenv').config({ path: '../../.env' })

const { execSync } = require("child_process")
const axios = require("axios")

describe(`Testing Docker`, () => {

    test("Check if Docker is installed", () => {
        try {
            const output = execSync("docker --version", { encoding: "utf-8" })
            expect(output).toMatch(/Docker version/)
        } catch (error) {
            throw new Error("Docker is not installed or not in PATH")
        }
    })

    test("Check if Docker is running", () => {
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

  it('should throw ECONNREFUSED if server refuses connection', async () => {
      expect.assertions(1)
      try {
          await axios.get(url, { timeout: 2000 })
      } catch (error) {
          expect(['ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT']).toContain(error.code)
          throw new Error("Redis Server is not running and offline.")
      }
  })

})