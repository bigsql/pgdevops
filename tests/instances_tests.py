from base import Singleton, PGC_API, BaseTest
import requests
import logging

logger = logging.getLogger(__name__)

class InstancesTests(BaseTest):
    def setUp(self):
        response = Singleton().response
        self.assertEqual(response['code'], 200)
        self.auth_token = response['authentication_token']

    def test_discover_aws_vms(self):
        headers = {
            "authentication_token": self.auth_token
        }
        response = requests.get(PGC_API + 'api/pgc/instances vm --cloud aws --region us-east-1', headers=headers)
        self.assertEqual(response.json()['code'], 200)
        logger.info('Discover AWS vms success')

    def test_discover_aws_dbs(self):
        headers = {
            "authentication_token": self.auth_token
        }
        response = requests.get(PGC_API + 'api/pgc/instances db --cloud aws --region us-east-1', headers=headers)
        self.assertEqual(response.json()['code'], 200)
        logger.info('Discover AWS vms success')
