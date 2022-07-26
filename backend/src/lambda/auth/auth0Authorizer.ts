import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'

import { verify } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
import Axios, {AxiosResponse} from 'axios'
//import { Jwt } from '../../auth/Jwt'
import { JwtPayload } from '../../auth/JwtPayload'

const logger = createLogger('auth')

// TODO: Provide a URL that can be used to download a certificate that can be used
// to verify JWT token signature.
// To get this URL you need to go to an Auth0 page -> Show Advanced Settings -> Endpoints -> JSON Web Key Set
const jwksUrl = 'https://dev-fkc00scy.us.auth0.com/.well-known/jwks.json'

const downloadedCert = `-----BEGIN CERTIFICATE-----
MIIDDTCCAfWgAwIBAgIJP7iFZRpOpsiEMA0GCSqGSIb3DQEBCwUAMCQxIjAgBgNV
BAMTGWRldi1ma2MwMHNjeS51cy5hdXRoMC5jb20wHhcNMjIwNzIxMjIwOTQ5WhcN
MzYwMzI5MjIwOTQ5WjAkMSIwIAYDVQQDExlkZXYtZmtjMDBzY3kudXMuYXV0aDAu
Y29tMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAz60JyXrfJB0LElws
M1wWNUopTI/elcViZRtPXGTQtPh0DcHFfAP4IE21/5AQ69ZtNjrObwFMy8tXtbGw
g1IX2XiqKmtQSGJzjS4tlz6XOZfGB88NronbvbScz9o/4IImlJpGUA7eb0XO8gEv
zizImUY+P2XKPkqHuz5wucTSVfFPwMr7S08x2Tj90NFr3my4Z0/eOF6RMnpPaEno
IssXrk/GKE3H4yjH1POhozNupT2EMjYd/lQsPmZ2w2vqpXsJM/6KsfuvPnor9wwE
GM4sXE1td0Kp35sbdRZ6NaM80DHMnD56U+Dk9ZoKBAOhZVZGz25pqPCodZj4kFgW
z+9gAwIDAQABo0IwQDAPBgNVHRMBAf8EBTADAQH/MB0GA1UdDgQWBBRDONda9Ju8
vwweW+03q8aHwupvYTAOBgNVHQ8BAf8EBAMCAoQwDQYJKoZIhvcNAQELBQADggEB
AIJmOtQPQhlCJoUQEpT56mCpiuKOPZeH/qyCwJYzJGpKvsY2orRJE7fOMabf/H3c
EJhhfrOKbR7HGnjlako9Kpkt903mtZfhHko6G2HVWzwzEROQg4akOENJ72lwRMW9
E5FxoE4lsTFI2Z+dZTowBKqrDm1J68GUbt+20Tud4tneztljK1JXlTed7/zqwQwB
412Iv1KSaapLkrfz7gEMm/VKHzcRF3HeleSdSS1Lvizpqpeqso+57U5c0i7Prr8r
5dMxVKBgMmnIA9fipjbojBhhOSZeEg3ChadxBxmLYbi4HdbS0m8FmE2kCbsJLAac
r67q3Hzd7F9Y9R3ctbov9wI=
-----END CERTIFICATE-----`

export const handler = async (
  event: CustomAuthorizerEvent
): Promise<CustomAuthorizerResult> => {
  logger.info('Authorizing a user', event.authorizationToken)
  try {
    const jwtToken = await verifyToken(event.authorizationToken)
    logger.info('User was authorized', jwtToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function verifyToken(authHeader: string): Promise<JwtPayload> {
  const token = getToken(authHeader)
  //const jwt: Jwt = decode(token, { complete: true }) as Jwt
  const certificate = await getCercificate(jwksUrl);

  // TODO: Implement token verification
  // You should implement it similarly to how it was implemented for the exercise for the lesson 5
  // You can read more about how to do this here: https://auth0.com/blog/navigating-rs256-and-jwks/
  return verify(token, certificate, { algorithms: ['RS256'] }) as JwtPayload
}

function getToken(authHeader: string): string {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')
  const split = authHeader.split(' ')
  const token = split[1]
  console.log(' WE GOT THE TOKEN FROM AUTH HEADER >>>', token)
  return token
}

async function getCercificate(jwkUrl:string):Promise<string> {
try{
  const jwk:AxiosResponse = await Axios.get(jwkUrl);
  console.log('THE ENTIRE RESPONSE IS>>>>', JSON.stringify(jwk.data.keys))
  console.log('THE DOWNLOADED CERTIFICATE IS>>>>>> ', jwk.data.keys[0]["x5c"][0] )
  //return jwk.data.keys[0]["x5c"][0];
  return downloadedCert
} catch(err){
 return '';
}
}
