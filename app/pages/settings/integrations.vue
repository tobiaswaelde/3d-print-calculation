<script setup lang="ts">
const route = useRoute();
const bambubuddy = route.hash.includes('bambubuddy');
const spoolman = route.hash.includes('spoolman');

await navigateTo(
  {
    path: bambubuddy ? '/settings/bambuddy' : spoolman ? '/settings/spoolman' : '/settings/features',
    query: route.query,
    hash:
      bambubuddy && route.hash === '#integration-bambubuddy'
        ? '#bambubuddy-configuration'
        : spoolman && route.hash === '#integration-spoolman'
          ? '#spoolman-configuration'
          : route.hash,
  },
  { replace: true, redirectCode: 301 },
);
</script>
